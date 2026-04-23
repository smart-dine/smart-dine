import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, desc, eq, inArray, schema, type Database } from '@smartdine/db';
import { DATABASE } from '../database/lib/definitions';
import { RbacService } from '../rbac/rbac.service';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { OrderItemStatus, OrderStatus } from './lib/order-status';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import {
  ORDER_COMPLETED_EVENT,
  ORDER_CREATED_EVENT,
  ORDER_ITEMS_UPDATED_EVENT,
  ORDER_STATUS_UPDATED_EVENT,
} from './lib/order-events';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly rbacService: RbacService,
    private readonly events: EventEmitter2,
  ) {}

  async createOrder({
    restaurantId,
    body,
    session,
  }: {
    restaurantId: string;
    body: CreateOrderDto;
    session: UserSession;
  }) {
    const table = await this.db.query.restaurantTables.findFirst({
      where: (tables) => and(eq(tables.id, body.tableId), eq(tables.restaurantId, restaurantId)),
    });

    if (!table) {
      throw new NotFoundException('Table not found for this restaurant');
    }

    const uniqueMenuItemIds = [...new Set(body.items.map((item) => item.menuItemId))];
    const menuItems = await this.db.query.menuItems.findMany({
      where: (menuItems) =>
        and(
          eq(menuItems.restaurantId, restaurantId),
          inArray(menuItems.id, uniqueMenuItemIds),
          eq(menuItems.isAvailable, true),
        ),
    });

    if (menuItems.length !== uniqueMenuItemIds.length) {
      throw new BadRequestException(
        'One or more menu items are unavailable or invalid for this restaurant',
      );
    }

    const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));
    const totalAmount = body.items.reduce((total, item) => {
      const menuItem = menuItemsById.get(item.menuItemId);
      if (!menuItem) {
        throw new BadRequestException(`Menu item ${item.menuItemId} is invalid for this order`);
      }
      return total + menuItem.price * item.quantity;
    }, 0);

    const order = await this.db.transaction(async (tx) => {
      const openOrder = await tx.query.orders.findFirst({
        columns: {
          id: true,
          totalAmount: true,
        },
        where: (orders) =>
          and(
            eq(orders.restaurantId, restaurantId),
            eq(orders.tableId, body.tableId),
            eq(orders.status, 'placed'),
          ),
        orderBy: (orders) => [desc(orders.createdAt)],
      });

      if (openOrder) {
        await tx.insert(schema.orderItems).values(
          body.items.map((item) => ({
            orderId: openOrder.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            specialInstructions: item.specialInstructions ?? null,
            status: 'placed' as const,
          })),
        );

        await tx
          .update(schema.orders)
          .set({
            totalAmount: openOrder.totalAmount + totalAmount,
            operatorId: session.user.id,
          })
          .where(eq(schema.orders.id, openOrder.id));

        return openOrder.id;
      }

      const [createdOrder] = await tx
        .insert(schema.orders)
        .values({
          restaurantId,
          tableId: body.tableId,
          operatorId: session.user.id,
          status: 'placed',
          totalAmount,
        })
        .returning({ id: schema.orders.id });

      await tx.insert(schema.orderItems).values(
        body.items.map((item) => ({
          orderId: createdOrder.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions ?? null,
          status: 'placed' as const,
        })),
      );

      return createdOrder.id;
    });

    const fullOrder = await this.getOrderWithDetails(order);

    this.events.emit(ORDER_CREATED_EVENT, {
      restaurantId,
      payload: fullOrder,
    });

    return fullOrder;
  }

  async getRestaurantOrders(restaurantId: string, status?: OrderStatus) {
    return await this.db.query.orders.findMany({
      where: (orders) =>
        status
          ? and(eq(orders.restaurantId, restaurantId), eq(orders.status, status))
          : eq(orders.restaurantId, restaurantId),
      orderBy: (orders) => [desc(orders.createdAt)],
      with: {
        table: {
          columns: {
            id: true,
            tableNumber: true,
            capacity: true,
          },
        },
        operator: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        orderItems: {
          columns: {
            id: true,
            quantity: true,
            specialInstructions: true,
            status: true,
          },
          with: {
            menuItem: {
              columns: {
                id: true,
                name: true,
                price: true,
                image: true,
              },
            },
          },
        },
      },
    });
  }

  async getOrder(orderId: string, session: UserSession) {
    const order = await this.getOrderWithDetails(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.assertCanManageOrder(order.restaurantId, session);
    return order;
  }

  async updateOrderStatus({
    orderId,
    status,
    session,
  }: {
    orderId: string;
    status: OrderStatus;
    session: UserSession;
  }) {
    const order = await this.db.query.orders.findFirst({
      where: (orders) => eq(orders.id, orderId),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.assertCanManageOrder(order.restaurantId, session);

    if (status === 'completed') {
      const items = await this.db.query.orderItems.findMany({
        columns: {
          status: true,
        },
        where: (orderItems) => eq(orderItems.orderId, orderId),
      });

      if (items.some((item) => item.status !== 'completed')) {
        throw new BadRequestException(
          'All order items must be completed before closing this order',
        );
      }
    }

    const [updated] = await this.db
      .update(schema.orders)
      .set({
        status,
        completedAt: status === 'completed' ? new Date() : null,
      })
      .where(eq(schema.orders.id, orderId))
      .returning();

    this.events.emit(ORDER_STATUS_UPDATED_EVENT, {
      restaurantId: updated.restaurantId,
      payload: updated,
    });

    if (status === 'completed') {
      this.events.emit(ORDER_COMPLETED_EVENT, {
        restaurantId: updated.restaurantId,
        payload: updated,
      });
    }

    return updated;
  }

  async updateOrderItemStatus({
    orderId,
    orderItemId,
    status,
    session,
  }: {
    orderId: string;
    orderItemId: string;
    status: OrderItemStatus;
    session: UserSession;
  }) {
    const order = await this.db.query.orders.findFirst({
      where: (orders) => eq(orders.id, orderId),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === 'completed') {
      throw new BadRequestException('Cannot modify items on a completed order');
    }

    await this.assertCanManageOrder(order.restaurantId, session);

    const [updatedItem] = await this.db
      .update(schema.orderItems)
      .set({
        status,
      })
      .where(and(eq(schema.orderItems.id, orderItemId), eq(schema.orderItems.orderId, orderId)))
      .returning({ id: schema.orderItems.id });

    if (!updatedItem) {
      throw new NotFoundException('Order item not found for this order');
    }

    const fullOrder = await this.getOrderWithDetails(orderId);

    if (!fullOrder) {
      throw new NotFoundException('Order not found');
    }

    this.events.emit(ORDER_ITEMS_UPDATED_EVENT, {
      restaurantId: fullOrder.restaurantId,
      payload: fullOrder,
    });

    return fullOrder;
  }

  private async getOrderWithDetails(orderId: string) {
    return this.db.query.orders.findFirst({
      where: (orders) => eq(orders.id, orderId),
      with: {
        table: {
          columns: {
            id: true,
            tableNumber: true,
            capacity: true,
          },
        },
        operator: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        orderItems: {
          columns: {
            id: true,
            quantity: true,
            specialInstructions: true,
            status: true,
          },
          with: {
            menuItem: {
              columns: {
                id: true,
                name: true,
                price: true,
                image: true,
              },
            },
          },
        },
      },
    });
  }

  private async assertCanManageOrder(restaurantId: string, session: UserSession) {
    const canManage = await this.rbacService.hasPermissions({
      session,
      permissions: ['orders:manage'],
      restaurantId,
    });

    if (!canManage) {
      throw new ForbiddenException('You cannot access this order');
    }
  }
}
