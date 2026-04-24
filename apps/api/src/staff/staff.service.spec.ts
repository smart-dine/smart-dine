import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StaffService } from './staff.service';
import { createMockDatabaseProvider } from '../common/testing/test-database.mock';

describe('StaffService', () => {
  let service: StaffService;
  let mockDb: any;
  let mockQuery: any;

  beforeEach(async () => {
    const { provider, mockDb: db, mockQuery: query } = createMockDatabaseProvider();
    mockDb = db;
    mockQuery = query;

    const module: TestingModule = await Test.createTestingModule({
      providers: [StaffService, provider],
    }).compile();

    service = module.get<StaffService>(StaffService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyRestaurants', () => {
    it('should return staff restaurants for a user', async () => {
      const staffRoles = [
        {
          id: 'sr1',
          userId: 'user-1',
          restaurantId: '1',
          role: 'owner',
          restaurant: {
            id: '1',
            name: 'Restaurant 1',
            description: 'Desc',
            address: 'Address',
            phone: '555-1234',
            images: [],
          },
        },
      ];

      mockQuery.staffRoles.findMany.mockResolvedValue(staffRoles);

      const result = await service.getMyRestaurants('user-1');

      expect(result).toEqual(staffRoles);
      expect(mockQuery.staffRoles.findMany).toHaveBeenCalled();
    });

    it('should return empty array when user has no restaurants', async () => {
      mockQuery.staffRoles.findMany.mockResolvedValue([]);

      const result = await service.getMyRestaurants('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getRestaurantStaff', () => {
    it('should return all staff for a restaurant', async () => {
      const staff = [
        {
          id: 'sr1',
          restaurantId: '1',
          user: {
            id: 'user-1',
            name: 'John',
            email: 'john@example.com',
            image: null,
            role: 'staff',
          },
          role: 'manager',
        },
      ];

      mockQuery.restaurants.findFirst.mockResolvedValue({ id: '1' });
      mockQuery.staffRoles.findMany.mockResolvedValue(staff);

      const result = await service.getRestaurantStaff('1');

      expect(result).toEqual(staff);
    });

    it('should throw NotFoundException when restaurant does not exist', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue(null);

      await expect(service.getRestaurantStaff('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addStaffRole', () => {
    it('should add a staff role to a restaurant', async () => {
      const user = { id: 'user-2', email: 'newstaff@example.com' };
      const staffRole = {
        id: 'sr1',
        restaurantId: '1',
        userId: 'user-2',
        role: 'staff',
      };

      mockQuery.restaurants.findFirst.mockResolvedValue({ id: '1' });
      mockQuery.users.findFirst.mockResolvedValue(user);
      mockQuery.staffRoles.findFirst.mockResolvedValue(null);

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([staffRole]),
        }),
      });

      const result = await service.addStaffRole('1', {
        email: 'newstaff@example.com',
        role: 'staff',
      });

      expect(result).toEqual(staffRole);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue({ id: '1' });
      mockQuery.users.findFirst.mockResolvedValue(null);

      await expect(
        service.addStaffRole('1', {
          email: 'nonexistent@example.com',
          role: 'staff',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user already has role', async () => {
      const user = { id: 'user-2' };
      const existingRole = { id: 'sr1', role: 'staff' };

      mockQuery.restaurants.findFirst.mockResolvedValue({ id: '1' });
      mockQuery.users.findFirst.mockResolvedValue(user);
      mockQuery.staffRoles.findFirst.mockResolvedValue(existingRole);

      await expect(
        service.addStaffRole('1', {
          email: 'existing@example.com',
          role: 'staff',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when restaurant does not exist', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue(null);

      await expect(
        service.addStaffRole('non-existent', {
          email: 'staff@example.com',
          role: 'staff',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStaffRole', () => {
    it('should update a staff role', async () => {
      const staffRole = {
        id: 'sr1',
        restaurantId: '1',
        userId: 'user-1',
        role: 'manager',
      };

      mockQuery.staffRoles.findFirst.mockResolvedValue(staffRole);
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ ...staffRole, role: 'staff' }]),
          }),
        }),
      });

      const result = await service.updateStaffRole('1', 'user-1', { role: 'staff' });

      expect(result.role).toBe('staff');
    });

    it('should throw NotFoundException when staff role does not exist', async () => {
      mockQuery.staffRoles.findFirst.mockResolvedValue(null);

      await expect(service.updateStaffRole('1', 'user-1', { role: 'staff' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeStaffRole', () => {
    it('should remove a staff role', async () => {
      mockQuery.staffRoles.findFirst.mockResolvedValue({ id: 'sr1' });
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'sr1' }]),
        }),
      });

      await service.removeStaffRole('1', 'sr1');

      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when role does not exist', async () => {
      mockQuery.staffRoles.findFirst.mockResolvedValue(null);

      await expect(service.removeStaffRole('1', 'sr1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when removing last owner', async () => {
      const staffRole = { id: 'sr1', role: 'owner' };

      mockQuery.staffRoles.findFirst.mockResolvedValue(staffRole);
      mockQuery.staffRoles.findMany.mockResolvedValue([staffRole]); // Only one owner

      await expect(service.removeStaffRole('1', 'sr1')).rejects.toThrow(BadRequestException);
    });
  });
});
