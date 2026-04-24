import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import {
  createMockDatabaseProvider,
  createMockDatabaseTransaction,
} from '../common/testing/test-database.mock';

describe('RestaurantsService', () => {
  let service: RestaurantsService;
  let mockDb: any;
  let mockQuery: any;

  beforeEach(async () => {
    const { provider, mockDb: db, mockQuery: query } = createMockDatabaseProvider();
    mockDb = db;
    mockQuery = query;

    const module: TestingModule = await Test.createTestingModule({
      providers: [RestaurantsService, provider],
    }).compile();

    service = module.get<RestaurantsService>(RestaurantsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all restaurants without search', async () => {
      const restaurants = [
        {
          id: '1',
          name: 'Restaurant 1',
          description: 'Desc 1',
          address: 'Address 1',
          phone: '555-1234',
          images: [],
          openingHours: {},
          createdAt: new Date(),
        },
      ];

      mockQuery.restaurants.findMany.mockResolvedValue(restaurants);

      const result = await service.findAll({ offset: 0, limit: 10 });

      expect(result).toEqual(restaurants);
      expect(mockQuery.restaurants.findMany).toHaveBeenCalled();
    });

    it('should return restaurants matching search term', async () => {
      const restaurants = [
        {
          id: '1',
          name: 'Pizza Palace',
          description: 'Italian cuisine',
          address: '123 Main St',
          phone: '555-1234',
          images: [],
          openingHours: {},
          createdAt: new Date(),
        },
      ];

      mockQuery.restaurants.findMany.mockResolvedValue(restaurants);

      const result = await service.findAll({ offset: 0, limit: 10, search: 'Pizza' });

      expect(result).toEqual(restaurants);
      expect(mockQuery.restaurants.findMany).toHaveBeenCalled();
    });

    it('should handle pagination', async () => {
      mockQuery.restaurants.findMany.mockResolvedValue([]);

      await service.findAll({ offset: 20, limit: 10 });

      expect(mockQuery.restaurants.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a restaurant with its menu items', async () => {
      const restaurant = {
        id: '1',
        name: 'Restaurant 1',
        menuItems: [
          {
            id: 'm1',
            name: 'Item 1',
            description: 'Desc',
            price: 10.99,
            image: null,
            isAvailable: true,
          },
        ],
      };

      mockQuery.restaurants.findFirst.mockResolvedValue(restaurant);

      const result = await service.findOne('1');

      expect(result).toEqual(restaurant);
      expect(mockQuery.restaurants.findFirst).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should throw NotFoundException when restaurant does not exist', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent')).rejects.toThrow('Restaurant not found');
    });
  });

  describe('findMenuItems', () => {
    it('should return menu items for a restaurant', async () => {
      const menuItems = [
        {
          id: 'm1',
          name: 'Burger',
          description: 'Delicious burger',
          price: 12.99,
          image: null,
          isAvailable: true,
          categories: [],
        },
      ];

      mockQuery.restaurants.findFirst.mockResolvedValue({ id: '1', name: 'Restaurant' });
      mockQuery.menuItems.findMany.mockResolvedValue(menuItems);

      const result = await service.findMenuItems('1');

      expect(result).toEqual(menuItems);
    });

    it('should throw NotFoundException if restaurant does not exist', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue(null);

      await expect(service.findMenuItems('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findFloorMap', () => {
    it('should return restaurant with floor plan', async () => {
      const restaurant = {
        id: '1',
        name: 'Restaurant 1',
        openingHours: {},
        tables: [
          {
            id: 't1',
            tableNumber: '1',
            capacity: 4,
            xCoordinate: 10,
            yCoordinate: 20,
            shape: 'square',
          },
        ],
      };

      mockQuery.restaurants.findFirst.mockResolvedValue(restaurant);

      const result = await service.findFloorMap('1');

      expect(result).toEqual(restaurant);
      expect(result.tables).toHaveLength(1);
    });

    it('should throw NotFoundException when restaurant does not exist', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue(null);

      await expect(service.findFloorMap('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRestaurant', () => {
    it('should update restaurant with provided fields', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue({ id: '1' });
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest
              .fn()
              .mockResolvedValue([{ id: '1', name: 'Updated Restaurant', address: 'New Address' }]),
          }),
        }),
      });

      const result = await service.updateRestaurant('1', {
        name: 'Updated Restaurant',
        address: 'New Address',
      });

      expect(result.id).toBe('1');
      expect(result.name).toBe('Updated Restaurant');
    });

    it('should throw BadRequestException when no fields provided', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue({ id: '1' });

      await expect(service.updateRestaurant('1', {})).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when restaurant does not exist', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue(null);

      await expect(service.updateRestaurant('1', { name: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createMenuItem', () => {
    it('should create a new menu item', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue({ id: '1' });
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'm1',
              restaurantId: '1',
              name: 'Pizza',
              description: 'Italian',
              price: 15.99,
              isAvailable: true,
              image: null,
            },
          ]),
        }),
      });

      const result = await service.createMenuItem('1', {
        name: 'Pizza',
        description: 'Italian',
        price: 15.99,
      });

      expect(result.id).toBe('m1');
      expect(result.name).toBe('Pizza');
      expect(result.restaurantId).toBe('1');
    });

    it('should throw NotFoundException when restaurant does not exist', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue(null);

      await expect(
        service.createMenuItem('non-existent', {
          name: 'Pizza',
          price: 15.99,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addRestaurantImage', () => {
    it('should add a new image to restaurant', async () => {
      const restaurant = {
        id: '1',
        name: 'Restaurant',
        images: ['image1.jpg'],
      };

      mockQuery.restaurants.findFirst.mockResolvedValue(restaurant);
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest
              .fn()
              .mockResolvedValue([{ ...restaurant, images: ['image1.jpg', 'image2.jpg'] }]),
          }),
        }),
      });

      const result = await service.addRestaurantImage('1', 'image2.jpg');

      expect(result.images).toContain('image2.jpg');
    });

    it('should not duplicate image if already exists', async () => {
      const restaurant = {
        id: '1',
        name: 'Restaurant',
        images: ['image1.jpg'],
      };

      mockQuery.restaurants.findFirst.mockResolvedValue(restaurant);

      const result = await service.addRestaurantImage('1', 'image1.jpg');

      expect(result).toEqual(restaurant);
    });
  });

  describe('removeRestaurantImage', () => {
    it('should remove an image from restaurant', async () => {
      const restaurant = {
        id: '1',
        name: 'Restaurant',
        images: ['image1.jpg', 'image2.jpg'],
      };

      mockQuery.restaurants.findFirst.mockResolvedValue(restaurant);
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ ...restaurant, images: ['image1.jpg'] }]),
          }),
        }),
      });

      const result = await service.removeRestaurantImage('1', 'image2.jpg');

      expect(result.images).not.toContain('image2.jpg');
    });

    it('should throw NotFoundException when image does not exist', async () => {
      const restaurant = {
        id: '1',
        name: 'Restaurant',
        images: ['image1.jpg'],
      };

      mockQuery.restaurants.findFirst.mockResolvedValue(restaurant);

      await expect(service.removeRestaurantImage('1', 'non-existent.jpg')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('replaceFloorPlan', () => {
    it('should replace floor plan with new tables', async () => {
      const { mockTx, mockTxQuery } = createMockDatabaseTransaction();

      const tables = [
        { tableNumber: '1', capacity: 4, xCoordinate: 10, yCoordinate: 20, shape: 'rectangle' as const },
        { tableNumber: '2', capacity: 2, xCoordinate: 30, yCoordinate: 40, shape: 'round' as const },
      ];

      const resultTables = [
        { id: 't1', tableNumber: '1', capacity: 4, xCoordinate: 10, yCoordinate: 20, shape: 'rectangle' as const },
        { id: 't2', tableNumber: '2', capacity: 2, xCoordinate: 30, yCoordinate: 40, shape: 'round' as const },
      ];

      mockQuery.restaurants.findFirst.mockResolvedValue({ id: '1' });
      mockQuery.restaurantTables.findMany.mockResolvedValue([]);

      mockDb.transaction.mockImplementation(async (cb) => {
        mockTxQuery.restaurantTables.findMany.mockResolvedValue(resultTables);
        return await cb(mockTx);
      });

      const result = await service.replaceFloorPlan('1', { tables });

      expect(result).toEqual(resultTables);
    });

    it('should throw BadRequestException for duplicate table numbers', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue({ id: '1' });

      await expect(
        service.replaceFloorPlan('1', {
          tables: [
            { tableNumber: '1', capacity: 4, xCoordinate: 10, yCoordinate: 20, shape: 'rectangle' as const },
            { tableNumber: '1', capacity: 2, xCoordinate: 30, yCoordinate: 40, shape: 'round' as const },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for unknown table ids', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue({ id: '1' });
      mockQuery.restaurantTables.findMany.mockResolvedValue([]);

      await expect(
        service.replaceFloorPlan('1', {
          tables: [
            { id: 'unknown-id', tableNumber: '1', capacity: 4, xCoordinate: 10, yCoordinate: 20, shape: 'rectangle' as const },
          ],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMenuItem', () => {
    it('should update a menu item', async () => {
      const menuItem = { id: 'm1', restaurantId: '1', name: 'Burger', price: 12.99 };

      mockQuery.menuItems.findFirst.mockResolvedValue(menuItem);
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ ...menuItem, name: 'Cheeseburger' }]),
          }),
        }),
      });

      const result = await service.updateMenuItem('1', 'm1', { name: 'Cheeseburger' });

      expect(result.name).toBe('Cheeseburger');
    });

    it('should throw BadRequestException when no fields provided', async () => {
      mockQuery.menuItems.findFirst.mockResolvedValue({ id: 'm1' });

      await expect(service.updateMenuItem('1', 'm1', {})).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when menu item does not exist', async () => {
      mockQuery.menuItems.findFirst.mockResolvedValue(null);

      await expect(service.updateMenuItem('1', 'non-existent', { name: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteMenuItem', () => {
    it('should delete a menu item', async () => {
      const menuItem = { id: 'm1', restaurantId: '1', name: 'Burger' };

      mockQuery.menuItems.findFirst.mockResolvedValue(menuItem);
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([menuItem]),
        }),
      });

      const result = await service.deleteMenuItem('1', 'm1');

      expect(result).toEqual(menuItem);
    });

    it('should throw NotFoundException when menu item does not exist', async () => {
      mockQuery.menuItems.findFirst.mockResolvedValue(null);

      await expect(service.deleteMenuItem('1', 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCategories', () => {
    it('should return all categories for a restaurant', async () => {
      const categories = [
        { id: 'c1', restaurantId: '1', name: 'Appetizers' },
        { id: 'c2', restaurantId: '1', name: 'Main Courses' },
      ];

      mockQuery.restaurants.findFirst.mockResolvedValue({ id: '1' });
      mockQuery.menuItemCategories.findMany.mockResolvedValue(categories);

      const result = await service.getCategories('1');

      expect(result).toEqual(categories);
    });

    it('should throw NotFoundException when restaurant does not exist', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue(null);

      await expect(service.getCategories('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue({ id: '1' });
      mockQuery.menuItemCategories.findMany.mockResolvedValue([]);

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'c1', restaurantId: '1', name: 'Appetizers' }]),
        }),
      });

      const result = await service.createCategory('1', 'Appetizers');

      expect(result.name).toBe('Appetizers');
    });

    it('should throw ConflictException when category name already exists', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue({ id: '1' });
      mockQuery.menuItemCategories.findMany.mockResolvedValue([{ name: 'Appetizers' }]);

      await expect(service.createCategory('1', 'Appetizers')).rejects.toThrow();
    });

    it('should throw NotFoundException when restaurant does not exist', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue(null);

      await expect(service.createCategory('non-existent', 'Appetizers')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category', async () => {
      const category = { id: 'c1', restaurantId: '1', name: 'Appetizers' };

      mockQuery.restaurants.findFirst.mockResolvedValue({ id: '1' });
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([category]),
        }),
      });

      const result = await service.deleteCategory('1', 'c1');

      expect(result).toEqual(category);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue({ id: '1' });
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.deleteCategory('1', 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('setMenuItemCategories', () => {
    it('should set categories for a menu item', async () => {
      const menuItem = { id: 'm1', restaurantId: '1', name: 'Burger' };
      const categories = [
        { id: 'c1', restaurantId: '1', name: 'Appetizers' },
        { id: 'c2', restaurantId: '1', name: 'Main Courses' },
      ];

      mockQuery.menuItems.findFirst.mockResolvedValue(menuItem);
      mockQuery.menuItemCategories.findMany.mockResolvedValue(categories);
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      mockQuery.menuItems.findFirst.mockResolvedValue({
        ...menuItem,
        categories: categories.map((c) => ({ category: c })),
      });

      const result = await service.setMenuItemCategories('1', 'm1', ['c1', 'c2']);

      expect(result).toBeDefined();
    });

    it('should throw BadRequestException for duplicate category IDs', async () => {
      mockQuery.menuItems.findFirst.mockResolvedValue({ id: 'm1' });

      await expect(service.setMenuItemCategories('1', 'm1', ['c1', 'c1'])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid category IDs', async () => {
      mockQuery.menuItems.findFirst.mockResolvedValue({ id: 'm1' });
      mockQuery.menuItemCategories.findMany.mockResolvedValue([{ id: 'c1' }]);

      await expect(service.setMenuItemCategories('1', 'm1', ['c1', 'invalid'])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when menu item does not exist', async () => {
      mockQuery.menuItems.findFirst.mockResolvedValue(null);

      await expect(service.setMenuItemCategories('1', 'non-existent', ['c1'])).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
