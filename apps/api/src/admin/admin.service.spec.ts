import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { createMockDatabaseProvider, createMockDatabaseTransaction } from '../common/testing/test-database.mock';

describe('AdminService', () => {
  let service: AdminService;
  let mockDb: any;
  let mockQuery: any;

  beforeEach(async () => {
    const { provider, mockDb: db, mockQuery: query } = createMockDatabaseProvider();
    mockDb = db;
    mockQuery = query;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, provider],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRestaurants', () => {
    it('should return all restaurants with owner information', async () => {
      const restaurants = [
        {
          id: '1',
          name: 'Restaurant 1',
          description: 'Desc',
          address: 'Address 1',
          phone: '555-1234',
          staffRoles: [
            {
              id: 'sr1',
              role: 'owner',
              user: {
                id: 'user-1',
                name: 'Owner Name',
                email: 'owner@example.com',
                image: null,
              },
            },
          ],
        },
      ];

      mockQuery.restaurants.findMany.mockResolvedValue(restaurants);

      const result = await service.getRestaurants();

      expect(result).toEqual(restaurants);
      expect(mockQuery.restaurants.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no restaurants exist', async () => {
      mockQuery.restaurants.findMany.mockResolvedValue([]);

      const result = await service.getRestaurants();

      expect(result).toEqual([]);
    });
  });

  describe('createRestaurant', () => {
    it('should create a new restaurant with owner', async () => {
      const { mockTx } = createMockDatabaseTransaction();

      const owner = { id: 'user-1' };
      const newRestaurant = {
        id: '1',
        name: 'New Restaurant',
        description: 'New desc',
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
        images: [],
      };

      mockQuery.users.findFirst.mockResolvedValue(owner);
      mockDb.transaction.mockImplementation(async (cb) => {
        const mockReturning = jest.fn().mockResolvedValue([newRestaurant]);
        mockTx.insert.mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: mockReturning,
          }),
        });
        return await cb(mockTx);
      });

      const result = await service.createRestaurant({
        name: 'New Restaurant',
        description: 'New desc',
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

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when owner user not found', async () => {
      mockQuery.users.findFirst.mockResolvedValue(null);

      await expect(
        service.createRestaurant({
          name: 'New Restaurant',
          description: 'Desc',
          address: 'Address',
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
          ownerUserId: 'non-existent',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listUsers', () => {
    it('should return paginated users', async () => {
      const users = [
        {
          id: 'user-1',
          name: 'John',
          email: 'john@example.com',
          role: 'user',
        },
      ];

      mockQuery.users.findMany.mockResolvedValue(users);

      const result = await service.getUsers({ offset: 0, limit: 10 });

      expect(result).toEqual(users);
      expect(mockQuery.users.findMany).toHaveBeenCalled();
    });

    it('should support search functionality', async () => {
      const users = [
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
        },
      ];

      mockQuery.users.findMany.mockResolvedValue(users);

      const result = await service.getUsers({ offset: 0, limit: 10, search: 'John' });

      expect(result).toEqual(users);
      expect(mockQuery.users.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no users match', async () => {
      mockQuery.users.findMany.mockResolvedValue([]);

      const result = await service.getUsers({ offset: 0, limit: 10, search: 'NonExistent' });

      expect(result).toEqual([]);
    });
  });

  describe('assignRestaurantOwner', () => {
    it('should assign an owner to restaurant', async () => {
      const restaurant = { id: '1' };
      const owner = { id: 'user-1' };

      mockQuery.restaurants.findFirst.mockResolvedValue(restaurant);
      mockQuery.users.findFirst.mockResolvedValue(owner);
      mockQuery.staffRoles.findFirst.mockResolvedValue(null);

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            { id: 'sr1', restaurantId: '1', userId: 'user-1', role: 'owner' },
          ]),
        }),
      });

      const result = await service.assignRestaurantOwner({
        restaurantId: '1',
        ownerUserId: 'user-1',
      });

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when restaurant not found', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue(null);

      await expect(
        service.assignRestaurantOwner({
          restaurantId: 'non-existent',
          ownerUserId: 'user-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeRestaurantOwner', () => {
    it('should remove an owner assignment from restaurant', async () => {
      const restaurant = { id: '1' };
      const ownerRole = { id: 'sr1' };
      const otherOwnerRole = { id: 'sr2' };

      mockQuery.restaurants.findFirst.mockResolvedValue(restaurant);
      mockQuery.staffRoles.findFirst.mockResolvedValue(ownerRole);
      mockQuery.staffRoles.findMany.mockResolvedValue([ownerRole, otherOwnerRole]); // Multiple owners

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'sr1' }]),
        }),
      });

      const result = await service.removeRestaurantOwner({
        restaurantId: '1',
        ownerUserId: 'user-1',
      });

      expect(result).toBeDefined();
    });

    it('should throw BadRequestException when removing last owner', async () => {
      const restaurant = { id: '1' };
      const ownerRole = { id: 'sr1' };

      mockQuery.restaurants.findFirst.mockResolvedValue(restaurant);
      mockQuery.staffRoles.findFirst.mockResolvedValue(ownerRole);
      mockQuery.staffRoles.findMany.mockResolvedValue([ownerRole]); // Only one owner

      await expect(
        service.removeRestaurantOwner({
          restaurantId: '1',
          ownerUserId: 'user-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteRestaurant', () => {
    it('should delete a restaurant', async () => {
      const restaurant = { id: '1' };

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([restaurant]),
        }),
      });

      const result = await service.deleteRestaurant('1');

      expect(result).toEqual({ deleted: true, restaurantId: '1' });
    });

    it('should throw NotFoundException when restaurant does not exist', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.deleteRestaurant('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
