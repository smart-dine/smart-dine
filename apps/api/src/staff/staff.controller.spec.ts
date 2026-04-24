// Mock ESM modules before importing anything else
jest.mock('@thallesp/nestjs-better-auth', () => ({
  Session: () => () => {},
}));

jest.mock('../rbac/decorators/require-permissions.decorator', () => ({
  RequireRestaurantPermissions: () => () => {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

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

describe('StaffController', () => {
  let controller: StaffController;
  let service: StaffService;

  const mockStaffService = {
    getMyRestaurants: jest.fn(),
    getRestaurantStaff: jest.fn(),
    addStaffRole: jest.fn(),
    updateStaffRole: jest.fn(),
    removeStaffRole: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffController],
      providers: [
        {
          provide: StaffService,
          useValue: mockStaffService,
        },
      ],
    }).compile();

    controller = module.get<StaffController>(StaffController);
    service = module.get<StaffService>(StaffService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyRestaurants', () => {
    it('should return restaurants for authenticated user', async () => {
      const restaurants = [
        {
          id: '1',
          name: 'Restaurant 1',
          description: 'Desc',
        },
      ];

      mockStaffService.getMyRestaurants.mockResolvedValue(restaurants);

      const result = await controller.getMyRestaurants(createMockSession('user-1'));

      expect(result).toEqual(restaurants);
      expect(service.getMyRestaurants).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getRestaurantStaff', () => {
    it('should return staff list for a restaurant', async () => {
      const staff = [
        {
          id: 'sr1',
          restaurantId: '1',
          user: {
            id: 'user-1',
            name: 'John',
            email: 'john@example.com',
            role: 'staff',
          },
        },
      ];

      mockStaffService.getRestaurantStaff.mockResolvedValue(staff);

      const result = await controller.getRestaurantStaff('1');

      expect(result).toEqual(staff);
      expect(service.getRestaurantStaff).toHaveBeenCalledWith('1');
    });
  });

  describe('addStaffRole', () => {
    it('should add a new staff role', async () => {
      const staffRole = {
        id: 'sr1',
        restaurantId: '1',
        userId: 'user-2',
        role: 'staff',
      };

      mockStaffService.addStaffRole.mockResolvedValue(staffRole);

      const result = await controller.addStaffRole('1', {
        email: 'newstaff@example.com',
        role: 'employee',
      });

      expect(result).toEqual(staffRole);
      expect(service.addStaffRole).toHaveBeenCalledWith('1', {
        email: 'newstaff@example.com',
        role: 'employee',
      });
    });
  });

  describe('updateStaffRole', () => {
    it('should update a staff role', async () => {
      const updated = {
        id: 'sr1',
        restaurantId: '1',
        userId: 'user-1',
        role: 'manager',
      };

      mockStaffService.updateStaffRole.mockResolvedValue(updated);

      const result = await controller.updateStaffRole('1', 'sr1', { role: 'manager' });

      expect(result).toEqual(updated);
      expect(service.updateStaffRole).toHaveBeenCalledWith('1', 'sr1', { role: 'manager' });
    });
  });

  describe('removeStaffRole', () => {
    it('should remove a staff role', async () => {
      mockStaffService.removeStaffRole.mockResolvedValue(undefined);

      await controller.removeStaffRole('1', 'sr1');

      expect(service.removeStaffRole).toHaveBeenCalledWith('1', 'sr1');
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
