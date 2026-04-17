import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DATABASE } from '../database/lib/definitions';
import { and, asc, desc, eq, ilike, inArray, or, schema, type Database } from '@smartdine/db';
import { R2StorageService } from '../common/storage/spaces-storage.service';
import { ListRestaurantsDto } from './dto/list-restaurants.dto';
import type { CreateMenuItemDto } from './dto/create-menu-item.dto';
import type { ReplaceFloorPlanDto } from './dto/replace-floor-plan.dto';
import type { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import type { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly r2Storage: R2StorageService,
  ) {}

  async findAll({ offset, limit, search }: ListRestaurantsDto) {
    const term = search?.trim();

    return await this.db.query.restaurants.findMany({
      columns: {
        id: true,
        name: true,
        description: true,
        address: true,
        phone: true,
        images: true,
        openingHours: true,
        createdAt: true,
      },
      where: term
        ? (restaurants) =>
            or(
              ilike(restaurants.name, `%${term}%`),
              ilike(restaurants.description, `%${term}%`),
              ilike(restaurants.address, `%${term}%`),
              ilike(restaurants.phone, `%${term}%`),
            )
        : undefined,
      orderBy: (restaurants) => desc(restaurants.createdAt),
      offset,
      limit,
    });
  }

  async findOne(restaurantId: string) {
    const restaurant = await this.db.query.restaurants.findFirst({
      where: (restaurants) => eq(restaurants.id, restaurantId),
      with: {
        menuItems: {
          columns: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
            isAvailable: true,
          },
          orderBy: (menuItems) => asc(menuItems.name),
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async findMenuItems(restaurantId: string) {
    await this.assertRestaurantExists(restaurantId);

    return await this.db.query.menuItems.findMany({
      where: (menuItems) => eq(menuItems.restaurantId, restaurantId),
      orderBy: (menuItems) => asc(menuItems.name),
    });
  }

  async findFloorMap(restaurantId: string) {
    const restaurant = await this.db.query.restaurants.findFirst({
      columns: {
        id: true,
        name: true,
        openingHours: true,
      },
      where: (restaurants) => eq(restaurants.id, restaurantId),
      with: {
        tables: {
          columns: {
            id: true,
            tableNumber: true,
            capacity: true,
            xCoordinate: true,
            yCoordinate: true,
            shape: true,
          },
          orderBy: (tables) => asc(tables.tableNumber),
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async updateRestaurant(restaurantId: string, dto: UpdateRestaurantDto) {
    await this.assertRestaurantExists(restaurantId);

    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No restaurant fields were provided for update');
    }

    const [updated] = await this.db
      .update(schema.restaurants)
      .set({
        name: dto.name,
        description: dto.description,
        address: dto.address,
        phone: dto.phone,
        openingHours: dto.openingHours,
        images: dto.images,
      })
      .where(eq(schema.restaurants.id, restaurantId))
      .returning();

    return updated;
  }

  async replaceFloorPlan(restaurantId: string, dto: ReplaceFloorPlanDto) {
    await this.assertRestaurantExists(restaurantId);

    const normalizedTableNumbers = new Set<string>();
    for (const table of dto.tables) {
      const normalized = table.tableNumber.trim().toLowerCase();
      if (normalizedTableNumbers.has(normalized)) {
        throw new BadRequestException('Floor plan payload contains duplicate table numbers');
      }
      normalizedTableNumbers.add(normalized);
    }

    const existingTables = await this.db.query.restaurantTables.findMany({
      columns: {
        id: true,
      },
      where: (tables) => eq(tables.restaurantId, restaurantId),
    });

    const existingTableIdSet = new Set(existingTables.map((table) => table.id));
    const incomingTableIdSet = new Set(dto.tables.flatMap((table) => (table.id ? [table.id] : [])));

    const unknownIds = [...incomingTableIdSet].filter((id) => !existingTableIdSet.has(id));
    if (unknownIds.length > 0) {
      throw new NotFoundException(
        'One or more provided table ids were not found for this restaurant',
      );
    }

    const tableIdsToDelete = existingTables
      .map((table) => table.id)
      .filter((id) => !incomingTableIdSet.has(id));

    try {
      return await this.db.transaction(async (tx) => {
        if (tableIdsToDelete.length > 0) {
          await tx
            .delete(schema.restaurantTables)
            .where(
              and(
                eq(schema.restaurantTables.restaurantId, restaurantId),
                inArray(schema.restaurantTables.id, tableIdsToDelete),
              ),
            );
        }

        for (const table of dto.tables) {
          const row = {
            tableNumber: table.tableNumber.trim(),
            capacity: table.capacity,
            xCoordinate: table.xCoordinate,
            yCoordinate: table.yCoordinate,
            shape: table.shape,
          };

          if (table.id) {
            await tx
              .update(schema.restaurantTables)
              .set(row)
              .where(
                and(
                  eq(schema.restaurantTables.id, table.id),
                  eq(schema.restaurantTables.restaurantId, restaurantId),
                ),
              );
            continue;
          }

          await tx.insert(schema.restaurantTables).values({
            restaurantId,
            ...row,
          });
        }

        return await tx.query.restaurantTables.findMany({
          where: (tables) => eq(tables.restaurantId, restaurantId),
          orderBy: (tables) => asc(tables.tableNumber),
        });
      });
    } catch (error: unknown) {
      if (this.isForeignKeyViolation(error)) {
        throw new ConflictException(
          'Cannot remove one or more tables because reservations or orders still reference them',
        );
      }

      throw error;
    }
  }

  async addRestaurantImage(restaurantId: string, imageUrl: string) {
    const restaurant = await this.getRestaurantOrThrow(restaurantId);

    if (restaurant.images.includes(imageUrl)) {
      return restaurant;
    }

    const [updated] = await this.db
      .update(schema.restaurants)
      .set({
        images: [...restaurant.images, imageUrl],
      })
      .where(eq(schema.restaurants.id, restaurantId))
      .returning();

    return updated;
  }

  async uploadRestaurantImage(restaurantId: string, image: Express.Multer.File) {
    const restaurant = await this.getRestaurantOrThrow(restaurantId);
    const uploaded = await this.r2Storage.uploadRestaurantImage(restaurantId, image);

    try {
      if (restaurant.images.includes(uploaded.url)) {
        return restaurant;
      }

      const [updated] = await this.db
        .update(schema.restaurants)
        .set({
          images: [...restaurant.images, uploaded.url],
        })
        .where(eq(schema.restaurants.id, restaurantId))
        .returning();

      return updated;
    } catch (error) {
      await this.tryDeleteUploadedObject(uploaded.key);
      throw error;
    }
  }

  async removeRestaurantImage(restaurantId: string, imageUrl: string) {
    const restaurant = await this.getRestaurantOrThrow(restaurantId);

    const nextImages = restaurant.images.filter((image) => image !== imageUrl);
    if (nextImages.length === restaurant.images.length) {
      throw new NotFoundException('Image URL was not found on this restaurant');
    }

    const [updated] = await this.db
      .update(schema.restaurants)
      .set({ images: nextImages })
      .where(eq(schema.restaurants.id, restaurantId))
      .returning();

    return updated;
  }

  async createMenuItem(restaurantId: string, dto: CreateMenuItemDto) {
    await this.assertRestaurantExists(restaurantId);

    const [created] = await this.db
      .insert(schema.menuItems)
      .values({
        restaurantId,
        name: dto.name,
        description: dto.description ?? null,
        price: dto.price,
        isAvailable: dto.isAvailable ?? true,
        image: dto.image ?? null,
      })
      .returning();

    return created;
  }

  async uploadMenuItemImage(restaurantId: string, menuItemId: string, image: Express.Multer.File) {
    await this.assertMenuItemExists(restaurantId, menuItemId);
    const uploaded = await this.r2Storage.uploadMenuItemImage(restaurantId, menuItemId, image);

    try {
      const [updated] = await this.db
        .update(schema.menuItems)
        .set({
          image: uploaded.url,
        })
        .where(
          and(eq(schema.menuItems.id, menuItemId), eq(schema.menuItems.restaurantId, restaurantId)),
        )
        .returning();

      if (!updated) {
        throw new NotFoundException('Menu item not found for this restaurant');
      }

      return updated;
    } catch (error) {
      await this.tryDeleteUploadedObject(uploaded.key);
      throw error;
    }
  }

  async updateMenuItem(restaurantId: string, menuItemId: string, dto: UpdateMenuItemDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No menu item fields were provided for update');
    }

    await this.assertMenuItemExists(restaurantId, menuItemId);

    const [updated] = await this.db
      .update(schema.menuItems)
      .set({
        name: dto.name,
        description: dto.description,
        price: dto.price,
        isAvailable: dto.isAvailable,
        image: dto.image,
      })
      .where(eq(schema.menuItems.id, menuItemId))
      .returning();

    return updated;
  }

  async deleteMenuItem(restaurantId: string, menuItemId: string) {
    await this.assertMenuItemExists(restaurantId, menuItemId);

    const [deleted] = await this.db
      .delete(schema.menuItems)
      .where(eq(schema.menuItems.id, menuItemId))
      .returning();

    return deleted;
  }

  private async getRestaurantOrThrow(restaurantId: string) {
    const restaurant = await this.db.query.restaurants.findFirst({
      where: (restaurants) => eq(restaurants.id, restaurantId),
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  private async assertMenuItemExists(restaurantId: string, menuItemId: string) {
    const menuItem = await this.db.query.menuItems.findFirst({
      columns: {
        id: true,
      },
      where: (menuItems) =>
        and(eq(menuItems.id, menuItemId), eq(menuItems.restaurantId, restaurantId)),
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found for this restaurant');
    }
  }

  private async assertRestaurantExists(restaurantId: string) {
    const restaurant = await this.db.query.restaurants.findFirst({
      columns: {
        id: true,
      },
      where: (restaurants) => eq(restaurants.id, restaurantId),
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
  }

  private isForeignKeyViolation(error: unknown) {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const maybeCode = (error as { code?: unknown }).code;
    return maybeCode === '23503';
  }

  private async tryDeleteUploadedObject(key: string) {
    try {
      await this.r2Storage.deleteObjectByKey(key);
    } catch {
      return;
    }
  }
}
