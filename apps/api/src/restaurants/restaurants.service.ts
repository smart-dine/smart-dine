import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DATABASE } from '../database/lib/definitions';
import { and, asc, desc, eq, ilike, or, schema, type Database } from '@smartdine/db';
import { ListRestaurantsDto } from './dto/list-restaurants.dto';
import type { CreateMenuItemDto } from './dto/create-menu-item.dto';
import type { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import type { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantsService {
	constructor(@Inject(DATABASE) private readonly db: Database) {}

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
			where: (menuItems) => and(eq(menuItems.id, menuItemId), eq(menuItems.restaurantId, restaurantId)),
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
}
