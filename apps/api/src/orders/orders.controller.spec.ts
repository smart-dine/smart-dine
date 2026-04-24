// Mock ESM modules before importing anything else
jest.mock('@thallesp/nestjs-better-auth', () => ({
  Session: () => () => {},
}));

jest.mock('../rbac/decorators/require-permissions.decorator', () => ({
  RequireRestaurantPermissions: () => () => {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

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

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  const mockOrdersService = {
    createOrder: jest.fn(),
    getRestaurantOrders: jest.fn(),
    getOrder: jest.fn(),
    updateOrderStatus: jest.fn(),
    updateOrderItemStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create a new order', async () => {
      const order = {
        id: 'o1',
        restaurantId: '1',
        items: [{ menuItemId: 'm1', quantity: 2 }],
      };

      mockOrdersService.createOrder.mockResolvedValue(order);

      const session = createMockSession('user-1');

      const result = await controller.createOrder(
        '1',
        { tableId: 't1', items: [{ menuItemId: 'm1', quantity: 2 }] },
        session,
      );

      expect(result).toEqual(order);
      expect(service.createOrder).toHaveBeenCalledWith({
        restaurantId: '1',
        body: { tableId: 't1', items: [{ menuItemId: 'm1', quantity: 2 }] },
        session,
      });
    });
  });

  describe('getRestaurantOrders', () => {
    it('should return all restaurant orders', async () => {
      const orders = [{ id: 'o1', restaurantId: '1', status: 'placed' }];

      mockOrdersService.getRestaurantOrders.mockResolvedValue(orders);

      const result = await controller.getRestaurantOrders('1', {});

      expect(result).toEqual(orders);
      expect(service.getRestaurantOrders).toHaveBeenCalledWith('1', undefined);
    });

    it('should filter by status', async () => {
      const orders = [{ id: 'o1', restaurantId: '1', status: 'completed' }];

      mockOrdersService.getRestaurantOrders.mockResolvedValue(orders);

      await controller.getRestaurantOrders('1', { status: 'completed' });

      expect(service.getRestaurantOrders).toHaveBeenCalledWith('1', 'completed');
    });
  });

  describe('getOrder', () => {
    it('should return a single order by id', async () => {
      const order = {
        id: 'o1',
        restaurantId: '1',
        status: 'placed',
        items: [],
      };

      mockOrdersService.getOrder.mockResolvedValue(order);

      const result = await controller.getOrder('o1', createMockSession('user-1'));

      expect(result).toEqual(order);
      expect(service.getOrder).toHaveBeenCalledWith('o1', createMockSession('user-1'));
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const updated = {
        id: 'o1',
        restaurantId: '1',
        status: 'completed',
      };

      mockOrdersService.updateOrderStatus.mockResolvedValue(updated);

      const result = await controller.updateOrderStatus(
        'o1',
        { status: 'completed' },
        createMockSession('user-1'),
      );

      expect(result).toEqual(updated);
      expect(service.updateOrderStatus).toHaveBeenCalled();
    });
  });

  describe('updateOrderItemStatus', () => {
    it('should update order item status', async () => {
      const updated = {
        id: 'o1',
        restaurantId: '1',
        items: [{ id: 'oi1', status: 'completed' }],
      };

      mockOrdersService.updateOrderItemStatus.mockResolvedValue(updated);

      const result = await controller.updateOrderItemStatus(
        'o1',
        'oi1',
        { status: 'completed' },
        createMockSession('user-1'),
      );

      expect(result).toEqual(updated);
      expect(service.updateOrderItemStatus).toHaveBeenCalled();
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
