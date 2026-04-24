// Mock ESM modules before importing anything else
jest.mock('@thallesp/nestjs-better-auth', () => ({
  Session: () => () => {},
}));

jest.mock('../rbac/decorators/require-permissions.decorator', () => ({
  RequireRestaurantPermissions: () => () => {},
  RequirePermissions: () => () => {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let service: AdminService;

  const mockAdminService = {
    getRestaurants: jest.fn(),
    createRestaurant: jest.fn(),
    deleteRestaurant: jest.fn(),
    getUsers: jest.fn(),
    assignRestaurantOwner: jest.fn(),
    removeRestaurantOwner: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRestaurants', () => {
    it('should return all restaurants', async () => {
      const restaurants = [
        {
          id: '1',
          name: 'Restaurant 1',
          description: 'Desc 1',
          staffRoles: [],
        },
      ];

      mockAdminService.getRestaurants.mockResolvedValue(restaurants);

      const result = await controller.getRestaurants();

      expect(result).toEqual(restaurants);
      expect(service.getRestaurants).toHaveBeenCalled();
    });
  });

  describe('createRestaurant', () => {
    it('should create a new restaurant', async () => {
      const created = {
        id: '1',
        name: 'New Restaurant',
        description: 'Desc',
        address: '123 Main St',
        phone: '555-5678',
      };

      mockAdminService.createRestaurant.mockResolvedValue(created);

      const result = await controller.createRestaurant({
        name: 'New Restaurant',
        description: 'Desc',
        address: '123 Main St',
        phone: '555-5678',
        openingHours: {
          monday: { opens: '10:00', closes: '22:00', isClosed: false },
          tuesday: { opens: '10:00', closes: '22:00', isClosed: false },
          wednesday: { opens: '10:00', closes: '22:00', isClosed: false },
          thursday: { opens: '10:00', closes: '22:00', isClosed: false },
          friday: { opens: '10:00', closes: '22:00', isClosed: false },
          saturday: { opens: '11:00', closes: '23:00', isClosed: false },
          sunday: { opens: '11:00', closes: '22:00', isClosed: false },
        },
        ownerUserId: 'user-1',
      });

      expect(result).toEqual(created);
      expect(service.createRestaurant).toHaveBeenCalled();
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const users = [
        {
          id: 'user-1',
          name: 'John',
          email: 'john@example.com',
          role: 'user',
        },
      ];

      mockAdminService.getUsers.mockResolvedValue(users);

      const result = await controller.getUsers({ offset: 0, limit: 10 });

      expect(result).toEqual(users);
      expect(service.getUsers).toHaveBeenCalledWith({ offset: 0, limit: 10 });
    });

    it('should support search', async () => {
      const users = [];

      mockAdminService.getUsers.mockResolvedValue(users);

      await controller.getUsers({ offset: 0, limit: 10, search: 'John' });

      expect(service.getUsers).toHaveBeenCalledWith({
        offset: 0,
        limit: 10,
        search: 'John',
      });
    });
  });

  describe('updateRestaurantOwner', () => {
    it('should assign a restaurant owner', async () => {
      const updated = {
        id: 'sr1',
        restaurantId: '1',
        userId: 'user-1',
        role: 'owner',
      };

      mockAdminService.assignRestaurantOwner.mockResolvedValue(updated);

      const result = await controller.updateRestaurantOwner('1', { ownerUserId: 'user-1' });

      expect(result).toEqual(updated);
      expect(service.assignRestaurantOwner).toHaveBeenCalledWith({
        restaurantId: '1',
        ownerUserId: 'user-1',
      });
    });
  });

  describe('deleteRestaurant', () => {
    it('should delete a restaurant', async () => {
      mockAdminService.deleteRestaurant.mockResolvedValue({ deleted: true, restaurantId: '1' });

      await controller.deleteRestaurant('1');

      expect(service.deleteRestaurant).toHaveBeenCalledWith('1');
    });
  });

  describe('removeRestaurantOwner', () => {
    it('should remove a restaurant owner', async () => {
      mockAdminService.removeRestaurantOwner.mockResolvedValue({
        deleted: true,
        restaurantId: '1',
        ownerUserId: 'user-1',
      });

      await controller.removeRestaurantOwner('1', 'user-1');

      expect(service.removeRestaurantOwner).toHaveBeenCalled();
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
