import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DATABASE } from '../database/lib/definitions';
import { asc, desc, eq, ilike, or, type Database } from '@smartdine/db';
import { ListRestaurantsDto } from './dto/list-restaurants.dto';

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
