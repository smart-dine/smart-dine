import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrdersService } from './orders.service';
import { RbacService } from '../rbac/rbac.service';
import {
  createMockDatabaseProvider,
  createMockDatabaseTransaction,
} from '../common/testing/test-database.mock';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockDb: any;
  let mockQuery: any;
  let mockRbacService: any;
  let mockEvents: any;

  const createMockSession = (userId: string) => ({
    session: {
      id: 'session-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
      expiresAt: new Date(),
      token: 'token',
    },
    user: {
      id: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      email: 'test@example.com',
      emailVerified: true,
      name: 'Test User',
      image: null,
    },
  });

  beforeEach(async () => {
    const { provider, mockDb: db, mockQuery: query } = createMockDatabaseProvider();
    mockDb = db;
    mockQuery = query;

    mockRbacService = {
      hasPermissions: jest.fn().mockResolvedValue(true),
    };

    mockEvents = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        provider,
        {
          provide: RbacService,
          useValue: mockRbacService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEvents,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create a new order with items', async () => {
      const { mockTx, mockTxQuery } = createMockDatabaseTransaction();

      const table = { id: 't1', restaurantId: '1' };
      const menuItem = { id: 'm1', restaurantId: '1', price: 12.99, isAvailable: true };
      const session = createMockSession('user-1');

      mockQuery.restaurantTables.findFirst.mockResolvedValue(table);
      mockQuery.menuItems.findMany.mockResolvedValue([menuItem]);

      mockDb.transaction.mockImplementation(async (cb) => {
        mockTxQuery.orders.findFirst.mockResolvedValue(null);
        const mockReturning = jest.fn().mockResolvedValue([{ id: 'order-1' }]);
        mockTx.insert.mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: mockReturning,
          }),
        });
        return await cb(mockTx);
      });

      mockQuery.orders.findFirst.mockResolvedValue({
        id: 'order-1',
        restaurantId: '1',
        items: [],
      });

      const result = await service.createOrder({
        restaurantId: '1',
        body: {
          tableId: 't1',
          items: [{ menuItemId: 'm1', quantity: 2 }],
        },
        session,
      });

      expect(result).toBeDefined();
    });

    it('should append items to existing open order', async () => {
      const { mockTx, mockTxQuery } = createMockDatabaseTransaction();

      const table = { id: 't1', restaurantId: '1' };
      const menuItem = { id: 'm1', restaurantId: '1', price: 12.99, isAvailable: true };
      const session = createMockSession('user-1');
      const existingOrder = { id: 'order-1', totalAmount: 25.98 };

      mockQuery.restaurantTables.findFirst.mockResolvedValue(table);
      mockQuery.menuItems.findMany.mockResolvedValue([menuItem]);

      mockDb.transaction.mockImplementation(async (cb) => {
        mockTxQuery.orders.findFirst.mockResolvedValue(existingOrder);
        const mockReturning = jest.fn().mockResolvedValue([{ id: 'order-1' }]);
        mockTx.insert.mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: mockReturning,
          }),
        });
        mockTx.update.mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([existingOrder]),
            }),
          }),
        });
        return await cb(mockTx);
      });

      mockQuery.orders.findFirst.mockResolvedValue({
        id: 'order-1',
        restaurantId: '1',
        items: [],
      });

      const result = await service.createOrder({
        restaurantId: '1',
        body: {
          tableId: 't1',
          items: [{ menuItemId: 'm1', quantity: 2 }],
        },
        session,
      });

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when table not found', async () => {
      mockQuery.restaurantTables.findFirst.mockResolvedValue(null);

      await expect(
        service.createOrder({
          restaurantId: '1',
          body: {
            tableId: 't1',
            items: [{ menuItemId: 'm1', quantity: 2 }],
          },
          session: createMockSession('user-1'),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when menu items unavailable', async () => {
      mockQuery.restaurantTables.findFirst.mockResolvedValue({ id: 't1' });
      mockQuery.menuItems.findMany.mockResolvedValue([]);

      await expect(
        service.createOrder({
          restaurantId: '1',
          body: {
            tableId: 't1',
            items: [{ menuItemId: 'm1', quantity: 2 }],
          },
          session: createMockSession('user-1'),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRestaurantOrders', () => {
    it('should return all orders for a restaurant', async () => {
      const orders = [
        {
          id: 'o1',
          restaurantId: '1',
          status: 'placed',
          totalAmount: 50,
        },
      ];

      mockQuery.orders.findMany.mockResolvedValue(orders);

      const result = await service.getRestaurantOrders('1');

      expect(result).toEqual(orders);
      expect(mockQuery.orders.findMany).toHaveBeenCalled();
    });

    it('should filter orders by status', async () => {
      const orders = [
        {
          id: 'o1',
          restaurantId: '1',
          status: 'completed',
          totalAmount: 50,
        },
      ];

      mockQuery.orders.findMany.mockResolvedValue(orders);

      const result = await service.getRestaurantOrders('1', 'completed');

      expect(result).toEqual(orders);
      expect(mockQuery.orders.findMany).toHaveBeenCalled();
    });
  });

  describe('getOrder', () => {
    it('should return order details with items', async () => {
      const order = {
        id: 'o1',
        restaurantId: '1',
        status: 'placed',
        items: [],
      };

      mockQuery.orders.findFirst.mockResolvedValue(order);
      mockRbacService.hasPermissions.mockResolvedValue(true);

      const result = await service.getOrder('o1', createMockSession('user-1'));

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockQuery.orders.findFirst.mockResolvedValue(null);

      await expect(service.getOrder('non-existent', createMockSession('user-1'))).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user cannot manage order', async () => {
      const order = {
        id: 'o1',
        restaurantId: '1',
      };

      mockQuery.orders.findFirst.mockResolvedValue(order);
      mockRbacService.hasPermissions.mockResolvedValue(false);

      await expect(service.getOrder('o1', createMockSession('user-1'))).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status to completed', async () => {
      const order = {
        id: 'o1',
        restaurantId: '1',
        status: 'placed',
        items: [],
      };

      mockQuery.orders.findFirst.mockResolvedValue(order);
      mockRbacService.hasPermissions.mockResolvedValue(true);
      mockQuery.orderItems.findMany.mockResolvedValue([
        { status: 'completed' },
        { status: 'completed' },
      ]);
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ ...order, status: 'completed' }]),
          }),
        }),
      });

      const result = await service.updateOrderStatus({
        orderId: 'o1',
        status: 'completed',
        session: createMockSession('user-1'),
      });

      expect(result.status).toBe('completed');
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockQuery.orders.findFirst.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus({
          orderId: 'non-existent',
          status: 'completed',
          session: createMockSession('user-1'),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when completing order with incomplete items', async () => {
      const order = {
        id: 'o1',
        restaurantId: '1',
        status: 'placed',
      };

      mockQuery.orders.findFirst.mockResolvedValue(order);
      mockRbacService.hasPermissions.mockResolvedValue(true);
      mockQuery.orderItems.findMany.mockResolvedValue([
        { status: 'placed' },
        { status: 'placed' },
      ]);

      await expect(
        service.updateOrderStatus({
          orderId: 'o1',
          status: 'completed',
          session: createMockSession('user-1'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should complete order when all items are completed', async () => {
      const order = {
        id: 'o1',
        restaurantId: '1',
        status: 'placed',
      };

      mockQuery.orders.findFirst.mockResolvedValue(order);
      mockRbacService.hasPermissions.mockResolvedValue(true);
      mockQuery.orderItems.findMany.mockResolvedValue([
        { status: 'completed' },
        { status: 'completed' },
      ]);
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ ...order, status: 'completed' }]),
          }),
        }),
      });

      const result = await service.updateOrderStatus({
        orderId: 'o1',
        status: 'completed',
        session: createMockSession('user-1'),
      });

      expect(result.status).toBe('completed');
    });
  });

  describe('updateOrderItemStatus', () => {
    it('should update order item status', async () => {
      const order = {
        id: 'o1',
        restaurantId: '1',
        status: 'placed',
      };

      mockQuery.orders.findFirst.mockResolvedValue(order);
      mockRbacService.hasPermissions.mockResolvedValue(true);
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ id: 'oi1' }]),
          }),
        }),
      });

      mockQuery.orders.findFirst.mockResolvedValue({
        id: 'o1',
        restaurantId: '1',
        items: [{ id: 'oi1', status: 'completed' }],
      });

      const result = await service.updateOrderItemStatus({
        orderId: 'o1',
        orderItemId: 'oi1',
        status: 'completed',
        session: createMockSession('user-1'),
      });

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockQuery.orders.findFirst.mockResolvedValue(null);

      await expect(
        service.updateOrderItemStatus({
          orderId: 'non-existent',
          orderItemId: 'oi1',
          status: 'completed',
          session: createMockSession('user-1'),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when order is completed', async () => {
      const order = {
        id: 'o1',
        restaurantId: '1',
        status: 'completed',
      };

      mockQuery.orders.findFirst.mockResolvedValue(order);
      mockRbacService.hasPermissions.mockResolvedValue(true);

      await expect(
        service.updateOrderItemStatus({
          orderId: 'o1',
          orderItemId: 'oi1',
          status: 'completed',
          session: createMockSession('user-1'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when order item not found', async () => {
      const order = {
        id: 'o1',
        restaurantId: '1',
        status: 'placed',
      };

      mockQuery.orders.findFirst.mockResolvedValue(order);
      mockRbacService.hasPermissions.mockResolvedValue(true);
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        service.updateOrderItemStatus({
          orderId: 'o1',
          orderItemId: 'non-existent',
          status: 'completed',
          session: createMockSession('user-1'),
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
