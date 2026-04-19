import { env } from '#/env';
import type { RestaurantOrder, RestaurantOrderStatusPatch } from '#/lib/api/contracts';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

export type KioskConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface JoinKioskAck {
  joined: boolean;
  restaurantId: string;
}

interface CompleteOrderAck {
  success: boolean;
  orderId: string;
  status: 'completed';
}

export interface KioskRealtimeHandlers {
  onConnectionStateChange?: (state: KioskConnectionState) => void;
  onJoinSuccess?: (response: JoinKioskAck) => void;
  onJoinError?: (message: string) => void;
  onOrderCreated?: (order: RestaurantOrder) => void;
  onOrderStatusUpdated?: (orderPatch: RestaurantOrderStatusPatch) => void;
  onOrderCompleted?: (orderPatch: RestaurantOrderStatusPatch) => void;
}

export interface KioskRealtimeConnection {
  socket: Socket;
  completeOrder: (orderId: string) => Promise<void>;
  disconnect: () => void;
}

const KIOSK_NAMESPACE_URL = `${env.VITE_API_URL.replace(/\/$/, '')}/kiosk`;

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  return fallback;
};

const emitWithAck = <TPayload, TResult>(
  socket: Socket,
  event: string,
  payload: TPayload,
): Promise<TResult> =>
  new Promise<TResult>((resolve, reject) => {
    socket.timeout(10_000).emit(event, payload, (error: unknown, response: TResult) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response);
    });
  });

export const createKioskRealtimeConnection = ({
  restaurantId,
  handlers,
}: {
  restaurantId: string;
  handlers: KioskRealtimeHandlers;
}): KioskRealtimeConnection => {
  handlers.onConnectionStateChange?.('connecting');

  const socket = io(KIOSK_NAMESPACE_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    handlers.onConnectionStateChange?.('connected');

    void emitWithAck<{ restaurantId: string }, JoinKioskAck>(socket, 'kiosk.join', {
      restaurantId,
    })
      .then((response) => {
        if (!response.joined) {
          handlers.onJoinError?.('Kiosk room join was not accepted.');
          return;
        }

        handlers.onJoinSuccess?.(response);
      })
      .catch((error: unknown) => {
        handlers.onJoinError?.(extractErrorMessage(error, 'Failed to join kiosk room.'));
      });
  });

  socket.on('disconnect', () => {
    handlers.onConnectionStateChange?.('disconnected');
  });

  socket.on('connect_error', (error: unknown) => {
    handlers.onConnectionStateChange?.('error');
    handlers.onJoinError?.(extractErrorMessage(error, 'Failed to connect to kiosk realtime.'));
  });

  socket.on('order.created', (payload: RestaurantOrder) => {
    handlers.onOrderCreated?.(payload);
  });

  socket.on('order.status.updated', (payload: RestaurantOrderStatusPatch) => {
    handlers.onOrderStatusUpdated?.(payload);
  });

  socket.on('order.completed', (payload: RestaurantOrderStatusPatch) => {
    handlers.onOrderCompleted?.(payload);
  });

  return {
    socket,
    completeOrder: async (orderId: string) => {
      const response = await emitWithAck<{ orderId: string }, CompleteOrderAck>(
        socket,
        'order.complete',
        { orderId },
      );

      if (!response.success) {
        throw new Error('Failed to complete order.');
      }
    },
    disconnect: () => {
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
};
