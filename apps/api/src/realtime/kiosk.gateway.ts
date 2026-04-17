import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { OnEvent } from '@nestjs/event-emitter';
import { auth } from '../lib/auth';
import { RbacService } from '../rbac/rbac.service';
import { JoinKioskRoomDto } from './dto/join-kiosk-room.dto';
import { CompleteOrderDto } from './dto/complete-order.dto';
import { OrdersService } from '../orders/orders.service';
import {
  ORDER_COMPLETED_EVENT,
  ORDER_CREATED_EVENT,
  ORDER_STATUS_UPDATED_EVENT,
  type OrderSocketEventPayload,
} from '../orders/lib/order-events';

interface KioskSocketData {
  session?: UserSession;
}

@WebSocketGateway({
  namespace: 'kiosk',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    credentials: true,
  },
})
export class KioskGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly rbacService: RbacService,
    private readonly ordersService: OrdersService,
  ) {}

  async handleConnection(client: Socket) {
    const session = await this.resolveSession(client);

    if (!session?.user?.id) {
      client.disconnect(true);
      return;
    }

    (client.data as KioskSocketData).session = session;
  }

  handleDisconnect(client: Socket) {
    client.removeAllListeners();
  }

  @SubscribeMessage('kiosk.join')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  async joinRestaurantRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinKioskRoomDto,
  ) {
    const session = (client.data as KioskSocketData).session;

    if (!session?.user?.id) {
      throw new WsException('Authentication is required');
    }

    const hasAccess = await this.rbacService.hasPermissions({
      session,
      permissions: ['orders:manage'],
      restaurantId: payload.restaurantId,
    });

    if (!hasAccess) {
      throw new WsException('You do not have access to this restaurant kiosk');
    }

    await client.join(this.roomName(payload.restaurantId));

    return {
      joined: true,
      restaurantId: payload.restaurantId,
    };
  }

  @SubscribeMessage('order.complete')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  async completeOrder(@ConnectedSocket() client: Socket, @MessageBody() payload: CompleteOrderDto) {
    const session = (client.data as KioskSocketData).session;

    if (!session?.user?.id) {
      throw new WsException('Authentication is required');
    }

    try {
      const order = await this.ordersService.updateOrderStatus({
        orderId: payload.orderId,
        status: 'completed',
        session,
      });

      return {
        success: true,
        orderId: order.id,
        status: order.status,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new WsException(error.message);
      }

      throw new WsException('Failed to complete order');
    }
  }

  @OnEvent(ORDER_CREATED_EVENT)
  handleOrderCreatedEvent(event: OrderSocketEventPayload) {
    this.emitOrderCreated(event.restaurantId, event.payload);
  }

  @OnEvent(ORDER_STATUS_UPDATED_EVENT)
  handleOrderStatusUpdatedEvent(event: OrderSocketEventPayload) {
    this.emitOrderStatusUpdated(event.restaurantId, event.payload);
  }

  @OnEvent(ORDER_COMPLETED_EVENT)
  handleOrderCompletedEvent(event: OrderSocketEventPayload) {
    this.emitOrderCompleted(event.restaurantId, event.payload);
  }

  emitOrderCreated(restaurantId: string, payload: unknown) {
    this.server.to(this.roomName(restaurantId)).emit('order.created', payload);
  }

  emitOrderStatusUpdated(restaurantId: string, payload: unknown) {
    this.server.to(this.roomName(restaurantId)).emit('order.status.updated', payload);
  }

  emitOrderCompleted(restaurantId: string, payload: unknown) {
    this.server.to(this.roomName(restaurantId)).emit('order.completed', payload);
  }

  private roomName(restaurantId: string) {
    return `restaurant:${restaurantId}`;
  }

  private async resolveSession(client: Socket): Promise<UserSession | null> {
    const cookieHeader = client.handshake.headers.cookie;

    if (!cookieHeader) {
      return null;
    }

    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: cookieHeader,
      }),
    });

    if (!session?.user?.id) {
      return null;
    }

    return session as UserSession;
  }
}
