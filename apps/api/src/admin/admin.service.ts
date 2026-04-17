import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, ilike, or, schema, type Database } from '@smartdine/db';
import { DATABASE } from '../database/lib/definitions';
import type { CreateAdminRestaurantDto } from './dto/create-admin-restaurant.dto';
import type { ListAdminUsersDto } from './dto/list-admin-users.dto';

@Injectable()
export class AdminService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getRestaurants() {
    return await this.db.query.restaurants.findMany({
      orderBy: (restaurants) => asc(restaurants.name),
      with: {
        staffRoles: {
          where: (staffRoles) => eq(staffRoles.role, 'owner'),
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });
  }

  async createRestaurant(dto: CreateAdminRestaurantDto) {
    const owner = await this.db.query.users.findFirst({
      columns: {
        id: true,
      },
      where: (users) => eq(users.id, dto.ownerUserId),
    });

    if (!owner) {
      throw new NotFoundException('Owner user was not found');
    }

    return await this.db.transaction(async (tx) => {
      const [restaurant] = await tx
        .insert(schema.restaurants)
        .values({
          name: dto.name,
          description: dto.description ?? null,
          address: dto.address,
          phone: dto.phone,
          openingHours: dto.openingHours,
          images: dto.images ?? [],
        })
        .returning();

      await tx.insert(schema.staffRoles).values({
        restaurantId: restaurant.id,
        userId: dto.ownerUserId,
        role: 'owner',
      });

      return restaurant;
    });
  }

  async deleteRestaurant(restaurantId: string) {
    const [deleted] = await this.db
      .delete(schema.restaurants)
      .where(eq(schema.restaurants.id, restaurantId))
      .returning({
        id: schema.restaurants.id,
      });

    if (!deleted) {
      throw new NotFoundException('Restaurant not found');
    }

    return {
      deleted: true,
      restaurantId: deleted.id,
    };
  }

  async getUsers({ offset, limit, search }: ListAdminUsersDto) {
    const term = search?.trim();

    return await this.db.query.users.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
      where: term
        ? (users) => or(ilike(users.name, `%${term}%`), ilike(users.email, `%${term}%`))
        : undefined,
      orderBy: (users) => asc(users.name),
      offset,
      limit,
    });
  }

  async assignRestaurantOwner({
    restaurantId,
    ownerUserId,
  }: {
    restaurantId: string;
    ownerUserId: string;
  }) {
    const restaurant = await this.db.query.restaurants.findFirst({
      columns: {
        id: true,
      },
      where: (restaurants) => eq(restaurants.id, restaurantId),
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const owner = await this.db.query.users.findFirst({
      columns: {
        id: true,
      },
      where: (users) => eq(users.id, ownerUserId),
    });

    if (!owner) {
      throw new NotFoundException('Owner user was not found');
    }

    const existingStaffRole = await this.db.query.staffRoles.findFirst({
      where: (staffRoles) =>
        and(eq(staffRoles.restaurantId, restaurantId), eq(staffRoles.userId, ownerUserId)),
    });

    if (existingStaffRole) {
      if (existingStaffRole.role === 'owner') {
        return existingStaffRole;
      }

      const [updated] = await this.db
        .update(schema.staffRoles)
        .set({ role: 'owner' })
        .where(eq(schema.staffRoles.id, existingStaffRole.id))
        .returning();

      return updated;
    }

    const [created] = await this.db
      .insert(schema.staffRoles)
      .values({
        restaurantId,
        userId: ownerUserId,
        role: 'owner',
      })
      .returning();

    return created;
  }
}
