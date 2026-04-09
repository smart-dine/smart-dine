import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, inArray, schema, type Database } from '@smartdine/db';
import { DATABASE } from '../database/lib/definitions';
import { RbacService } from '../rbac/rbac.service';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { OrderStatus } from './lib/order-status';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { KioskGateway } from '../realtime/kiosk.gateway';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly rbacService: RbacService,
    private readonly kioskGateway: KioskGateway,
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

    const createdOrder = await this.db.transaction(async (tx) => {
      const [order] = await tx
        .insert(schema.orders)
        .values({
          restaurantId,
          tableId: body.tableId,
          operatorId: session.user.id,
          status: 'placed',
          totalAmount,
        })
        .returning();

      await tx.insert(schema.orderItems).values(
        body.items.map((item) => ({
          orderId: order.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions ?? null,
        })),
      );

      return order;
    });

    const order = await this.db.query.orders.findFirst({
      where: (orders) => eq(orders.id, createdOrder.id),
      with: {
        orderItems: {
          columns: {
            id: true,
            quantity: true,
            specialInstructions: true,
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
        table: {
          columns: {
            id: true,
            tableNumber: true,
            capacity: true,
          },
        },
      },
    });

    if (order) {
      this.kioskGateway.emitOrderCreated(restaurantId, order);
    }

    return order;
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
    const order = await this.db.query.orders.findFirst({
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

    const [updated] = await this.db
      .update(schema.orders)
      .set({
        status,
        completedAt: status === 'completed' ? new Date() : null,
      })
      .where(eq(schema.orders.id, orderId))
      .returning();

    this.kioskGateway.emitOrderStatusUpdated(updated.restaurantId, updated);

    if (status === 'completed') {
      this.kioskGateway.emitOrderCompleted(updated.restaurantId, updated);
    }

    return updated;
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
