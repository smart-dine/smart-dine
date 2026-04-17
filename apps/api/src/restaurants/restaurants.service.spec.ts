import { NotFoundException } from '@nestjs/common';
import type { Database } from '@smartdine/db';
import { RestaurantsService } from './restaurants.service';
import type { R2StorageService } from '../common/storage/spaces-storage.service';

describe('RestaurantsService image uploads', () => {
  const createImageFile = (): Express.Multer.File =>
    ({
      fieldname: 'image',
      originalname: 'dish.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 10,
      destination: '',
      filename: '',
      path: '',
      buffer: Buffer.from('image-bytes'),
      stream: undefined as unknown as NodeJS.ReadableStream,
    }) as Express.Multer.File;

  const createUpdateChain = () => {
    const returning = jest.fn();
    const where = jest.fn(() => ({ returning }));
    const set = jest.fn(() => ({ where }));

    return { set, where, returning };
  };

  const createMocks = () => {
    const db = {
      query: {
        restaurants: {
          findFirst: jest.fn(),
        },
        menuItems: {
          findFirst: jest.fn(),
        },
      },
      update: jest.fn(),
    } as unknown as Database;

    const uploadRestaurantImage = jest.fn();
    const uploadMenuItemImage = jest.fn();
    const deleteObjectByKey = jest.fn();

    const storage = {
      uploadRestaurantImage,
      uploadMenuItemImage,
      deleteObjectByKey,
    } as unknown as R2StorageService;

    const service = new RestaurantsService(db, storage);

    return {
      db,
      storage,
      service,
      uploadRestaurantImage,
      uploadMenuItemImage,
      deleteObjectByKey,
    };
  };

  it('persists uploaded restaurant image URL', async () => {
    const { db, service, uploadRestaurantImage, deleteObjectByKey } = createMocks();
    const chain = createUpdateChain();

    (db.query.restaurants.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'restaurant-1',
      images: ['https://cdn.smartdine.app/old.jpg'],
    });

    uploadRestaurantImage.mockResolvedValueOnce({
      key: 'restaurants/restaurant-1/new.jpg',
      url: 'https://cdn.smartdine.app/new.jpg',
    });

    (db.update as jest.Mock).mockReturnValueOnce({ set: chain.set });
    chain.returning.mockResolvedValueOnce([
      {
        id: 'restaurant-1',
        images: ['https://cdn.smartdine.app/old.jpg', 'https://cdn.smartdine.app/new.jpg'],
      },
    ]);

    const updated = await service.uploadRestaurantImage('restaurant-1', createImageFile());

    expect(updated).toEqual({
      id: 'restaurant-1',
      images: ['https://cdn.smartdine.app/old.jpg', 'https://cdn.smartdine.app/new.jpg'],
    });
    expect(deleteObjectByKey).not.toHaveBeenCalled();
  });

  it('rolls back uploaded restaurant object when DB update fails', async () => {
    const { db, service, uploadRestaurantImage, deleteObjectByKey } = createMocks();
    const chain = createUpdateChain();

    const dbError = new Error('database unavailable');

    (db.query.restaurants.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'restaurant-1',
      images: [],
    });

    uploadRestaurantImage.mockResolvedValueOnce({
      key: 'restaurants/restaurant-1/new.jpg',
      url: 'https://cdn.smartdine.app/new.jpg',
    });

    (db.update as jest.Mock).mockReturnValueOnce({ set: chain.set });
    chain.returning.mockRejectedValueOnce(dbError);

    await expect(service.uploadRestaurantImage('restaurant-1', createImageFile())).rejects.toBe(
      dbError,
    );
    expect(deleteObjectByKey).toHaveBeenCalledWith('restaurants/restaurant-1/new.jpg');
  });

  it('persists uploaded menu item image URL', async () => {
    const { db, service, uploadMenuItemImage, deleteObjectByKey } = createMocks();
    const chain = createUpdateChain();

    (db.query.menuItems.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'menu-1',
    });

    uploadMenuItemImage.mockResolvedValueOnce({
      key: 'restaurants/restaurant-1/menu-items/menu-1/new.jpg',
      url: 'https://cdn.smartdine.app/menu-new.jpg',
    });

    (db.update as jest.Mock).mockReturnValueOnce({ set: chain.set });
    chain.returning.mockResolvedValueOnce([
      {
        id: 'menu-1',
        image: 'https://cdn.smartdine.app/menu-new.jpg',
      },
    ]);

    const updated = await service.uploadMenuItemImage('restaurant-1', 'menu-1', createImageFile());

    expect(updated).toEqual({
      id: 'menu-1',
      image: 'https://cdn.smartdine.app/menu-new.jpg',
    });
    expect(deleteObjectByKey).not.toHaveBeenCalled();
  });

  it('rolls back uploaded menu item object when update target is missing', async () => {
    const { db, service, uploadMenuItemImage, deleteObjectByKey } = createMocks();
    const chain = createUpdateChain();

    (db.query.menuItems.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'menu-1',
    });

    uploadMenuItemImage.mockResolvedValueOnce({
      key: 'restaurants/restaurant-1/menu-items/menu-1/new.jpg',
      url: 'https://cdn.smartdine.app/menu-new.jpg',
    });

    (db.update as jest.Mock).mockReturnValueOnce({ set: chain.set });
    chain.returning.mockResolvedValueOnce([]);

    await expect(
      service.uploadMenuItemImage('restaurant-1', 'menu-1', createImageFile()),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(deleteObjectByKey).toHaveBeenCalledWith(
      'restaurants/restaurant-1/menu-items/menu-1/new.jpg',
    );
  });
});
