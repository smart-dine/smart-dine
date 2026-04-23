import { env } from '#/env';
import type { RestaurantOrder, RestaurantOrderStatusPatch } from '#/lib/api/contracts';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

export type KioskConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface JoinKioskAck {
  joined: boolean;
  restaurantId?: string;
  error?: string;
  code?: string;
}

interface CompleteOrderAck {
  success: boolean;
  orderId?: string;
  status?: 'completed';
  error?: string;
  code?: string;
}

export interface KioskRealtimeHandlers {
  onConnectionStateChange?: (state: KioskConnectionState) => void;
  onJoinSuccess?: (response: JoinKioskAck) => void;
  onJoinError?: (message: string) => void;
  onOrderCreated?: (order: RestaurantOrder) => void;
  onOrderStatusUpdated?: (orderPatch: RestaurantOrderStatusPatch) => void;
  onOrderCompleted?: (orderPatch: RestaurantOrderStatusPatch) => void;
  onOrderItemsUpdated?: (order: RestaurantOrder) => void;
}

export interface KioskRealtimeConnection {
  socket: Socket;
  completeOrder: (orderId: string) => Promise<void>;
  disconnect: () => void;
}

const KIOSK_NAMESPACE_URL = `${env.VITE_API_URL.replace(/\/$/, '')}/kiosk`;
const ACK_TIMEOUT_MS = 10_000;

const normalizeErrorMessage = (message: string) => {
  const normalized = message.trim().toLowerCase();

  if (normalized.includes('operation has timed out') || normalized === 'timeout') {
    return 'Kiosk realtime request timed out. Please wait while it reconnects.';
  }

  if (normalized.includes('socket has been disconnected')) {
    return 'Kiosk realtime connection was interrupted. Reconnecting...';
  }

  return message;
};

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return normalizeErrorMessage(error.message);
  }

  if (typeof error === 'string' && error.length > 0) {
    return normalizeErrorMessage(error);
  }

  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) {
      return normalizeErrorMessage(message);
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
    socket.timeout(ACK_TIMEOUT_MS).emit(event, payload, (error: unknown, response: TResult) => {
      if (error) {
        reject(new Error(extractErrorMessage(error, `Kiosk realtime ${event} request failed.`)));
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
    reconnection: true,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 5_000,
    timeout: 20_000,
  });

  let latestJoinAttempt = 0;

  const joinRoom = () => {
    const joinAttempt = ++latestJoinAttempt;

    void emitWithAck<{ restaurantId: string }, JoinKioskAck>(socket, 'kiosk.join', {
      restaurantId,
    })
      .then((response) => {
        if (joinAttempt !== latestJoinAttempt) {
          return;
        }

        if (!response.joined) {
          handlers.onConnectionStateChange?.('error');
          handlers.onJoinError?.(response.error ?? 'Kiosk room join was not accepted.');
          return;
        }

        handlers.onConnectionStateChange?.('connected');
        handlers.onJoinSuccess?.(response);
      })
      .catch((error: unknown) => {
        if (joinAttempt !== latestJoinAttempt) {
          return;
        }

        handlers.onConnectionStateChange?.('error');
        handlers.onJoinError?.(extractErrorMessage(error, 'Failed to join kiosk room.'));
      });
  };

  const handleConnect = () => {
    handlers.onConnectionStateChange?.('connecting');
    joinRoom();
  };

  const handleDisconnect = () => {
    handlers.onConnectionStateChange?.('disconnected');
  };

  const handleConnectError = (error: unknown) => {
    handlers.onConnectionStateChange?.('error');
    handlers.onJoinError?.(extractErrorMessage(error, 'Failed to connect to kiosk realtime.'));
  };

  const handleReconnectAttempt = () => {
    handlers.onConnectionStateChange?.('connecting');
  };

  const handleSocketException = (payload: unknown) => {
    handlers.onJoinError?.(extractErrorMessage(payload, 'Kiosk realtime operation failed.'));
  };

  socket.on('connect', handleConnect);

  socket.on('disconnect', handleDisconnect);

  socket.on('connect_error', handleConnectError);
  socket.on('exception', handleSocketException);
  socket.io.on('reconnect_attempt', handleReconnectAttempt);

  socket.on('order.created', (payload: RestaurantOrder) => {
    handlers.onOrderCreated?.(payload);
  });

  socket.on('order.status.updated', (payload: RestaurantOrderStatusPatch) => {
    handlers.onOrderStatusUpdated?.(payload);
  });

  socket.on('order.completed', (payload: RestaurantOrderStatusPatch) => {
    handlers.onOrderCompleted?.(payload);
  });

  socket.on('order.items.updated', (payload: RestaurantOrder) => {
    handlers.onOrderItemsUpdated?.(payload);
  });

  return {
    socket,
    completeOrder: async (orderId: string) => {
      if (!socket.connected) {
        throw new Error('Kiosk is currently reconnecting. Please try again in a moment.');
      }

      const response = await emitWithAck<{ orderId: string }, CompleteOrderAck>(
        socket,
        'order.complete',
        { orderId },
      );

      if (!response.success) {
        throw new Error(response.error ?? 'Failed to complete order.');
      }
    },
    disconnect: () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('exception', handleSocketException);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.disconnect();
    },
  };
};
