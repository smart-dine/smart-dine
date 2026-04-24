// Mock ESM modules before importing anything else
jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous: () => () => {},
}));

jest.mock('../rbac/decorators/require-permissions.decorator', () => ({
  RequireRestaurantPermissions: () => () => {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';

describe('RestaurantsController', () => {
  let controller: RestaurantsController;
  let service: RestaurantsService;

  const mockRestaurantsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findMenuItems: jest.fn(),
    findFloorMap: jest.fn(),
    updateRestaurant: jest.fn(),
    replaceFloorPlan: jest.fn(),
    addRestaurantImage: jest.fn(),
    removeRestaurantImage: jest.fn(),
    createMenuItem: jest.fn(),
    updateMenuItem: jest.fn(),
    deleteMenuItem: jest.fn(),
    setMenuItemCategories: jest.fn(),
    createCategory: jest.fn(),
    deleteCategory: jest.fn(),
    getCategories: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RestaurantsController],
      providers: [
        {
          provide: RestaurantsService,
          useValue: mockRestaurantsService,
        },
      ],
    }).compile();

    controller = module.get<RestaurantsController>(RestaurantsController);
    service = module.get<RestaurantsService>(RestaurantsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return list of restaurants', async () => {
      const restaurants = [{ id: '1', name: 'Restaurant 1', description: 'Desc 1' }];

      mockRestaurantsService.findAll.mockResolvedValue(restaurants);

      const result = await controller.findAll({ offset: 0, limit: 10 });

      expect(result).toEqual(restaurants);
      expect(service.findAll).toHaveBeenCalledWith({ offset: 0, limit: 10 });
    });

    it('should pass search parameter to service', async () => {
      const restaurants = [];
      mockRestaurantsService.findAll.mockResolvedValue(restaurants);

      await controller.findAll({ offset: 0, limit: 10, search: 'Pizza' });

      expect(service.findAll).toHaveBeenCalledWith({
        offset: 0,
        limit: 10,
        search: 'Pizza',
      });
    });
  });

  describe('findOne', () => {
    it('should return a single restaurant by id', async () => {
      const restaurant = {
        id: '1',
        name: 'Restaurant 1',
        menuItems: [],
      };

      mockRestaurantsService.findOne.mockResolvedValue(restaurant);

      const result = await controller.findOne('1');

      expect(result).toEqual(restaurant);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });

    it('should handle restaurant not found', async () => {
      mockRestaurantsService.findOne.mockRejectedValue(new Error('Restaurant not found'));

      await expect(controller.findOne('non-existent')).rejects.toThrow('Restaurant not found');
    });
  });

  describe('findMenuItems', () => {
    it('should return menu items for a restaurant', async () => {
      const menuItems = [{ id: 'm1', name: 'Burger', price: 12.99 }];

      mockRestaurantsService.findMenuItems.mockResolvedValue(menuItems);

      const result = await controller.findMenuItems('1');

      expect(result).toEqual(menuItems);
      expect(service.findMenuItems).toHaveBeenCalledWith('1');
    });
  });

  describe('findFloorMap', () => {
    it('should return floor map with tables', async () => {
      const floorMap = {
        id: '1',
        name: 'Restaurant 1',
        tables: [{ id: 't1', tableNumber: '1', capacity: 4 }],
      };

      mockRestaurantsService.findFloorMap.mockResolvedValue(floorMap);

      const result = await controller.findFloorMap('1');

      expect(result).toEqual(floorMap);
      expect(service.findFloorMap).toHaveBeenCalledWith('1');
    });
  });

  describe('updateRestaurant', () => {
    it('should update restaurant with provided fields', async () => {
      const updated = {
        id: '1',
        name: 'Updated Restaurant',
        address: 'New Address',
      };

      mockRestaurantsService.updateRestaurant.mockResolvedValue(updated);

      const result = await controller.updateRestaurant('1', {
        name: 'Updated Restaurant',
        address: 'New Address',
      });

      expect(result).toEqual(updated);
      expect(service.updateRestaurant).toHaveBeenCalledWith('1', {
        name: 'Updated Restaurant',
        address: 'New Address',
      });
    });
  });

  describe('replaceFloorPlan', () => {
    it('should replace floor plan with new tables', async () => {
      const updatedTables = [
        { id: 't1', tableNumber: '1', capacity: 4 },
        { id: 't2', tableNumber: '2', capacity: 2 },
      ];

      mockRestaurantsService.replaceFloorPlan.mockResolvedValue(updatedTables);

      const result = await controller.replaceFloorPlan('1', {
        tables: [
          {
            id: 't1',
            tableNumber: '1',
            capacity: 4,
            xCoordinate: 10,
            yCoordinate: 20,
            shape: 'rectangle',
          },
        ],
      });

      expect(result).toEqual(updatedTables);
      expect(service.replaceFloorPlan).toHaveBeenCalled();
    });
  });

  describe('addRestaurantImage', () => {
    it('should add image URL to restaurant', async () => {
      const updated = {
        id: '1',
        name: 'Restaurant',
        images: ['image1.jpg', 'image2.jpg'],
      };

      mockRestaurantsService.addRestaurantImage.mockResolvedValue(updated);

      const result = await controller.addRestaurantImage('1', {
        url: 'image2.jpg',
      });

      expect(result).toEqual(updated);
      expect(service.addRestaurantImage).toHaveBeenCalledWith('1', 'image2.jpg');
    });
  });

  describe('removeRestaurantImage', () => {
    it('should remove image URL from restaurant', async () => {
      const updated = {
        id: '1',
        name: 'Restaurant',
        images: ['image1.jpg'],
      };

      mockRestaurantsService.removeRestaurantImage.mockResolvedValue(updated);

      const result = await controller.removeRestaurantImage('1', {
        url: 'image2.jpg',
      });

      expect(result).toEqual(updated);
      expect(service.removeRestaurantImage).toHaveBeenCalledWith('1', 'image2.jpg');
    });
  });

  describe('getCategories', () => {
    it('should return categories for a restaurant', async () => {
      const categories = [
        { id: 'c1', name: 'Appetizers' },
        { id: 'c2', name: 'Main Courses' },
      ];

      mockRestaurantsService.getCategories.mockResolvedValue(categories);

      const result = await controller.getCategories('1');

      expect(result).toEqual(categories);
      expect(service.getCategories).toHaveBeenCalledWith('1');
    });
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const category = { id: 'c1', name: 'Appetizers' };

      mockRestaurantsService.createCategory.mockResolvedValue(category);

      const result = await controller.createCategory('1', { name: 'Appetizers' });

      expect(result).toEqual(category);
      expect(service.createCategory).toHaveBeenCalledWith('1', 'Appetizers');
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category', async () => {
      const category = { id: 'c1', name: 'Appetizers' };

      mockRestaurantsService.deleteCategory.mockResolvedValue(category);

      const result = await controller.deleteCategory('1', 'c1');

      expect(result).toEqual(category);
      expect(service.deleteCategory).toHaveBeenCalledWith('1', 'c1');
    });
  });

  describe('setMenuItemCategories', () => {
    it('should set categories for a menu item', async () => {
      const menuItem = {
        id: 'm1',
        name: 'Burger',
        categories: [
          { category: { id: 'c1', name: 'Appetizers' } },
          { category: { id: 'c2', name: 'Main Courses' } },
        ],
      };

      mockRestaurantsService.setMenuItemCategories.mockResolvedValue(menuItem);

      const result = await controller.setMenuItemCategories('1', 'm1', {
        categoryIds: ['c1', 'c2'],
      });

      expect(result).toEqual(menuItem);
      expect(service.setMenuItemCategories).toHaveBeenCalledWith('1', 'm1', ['c1', 'c2']);
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
