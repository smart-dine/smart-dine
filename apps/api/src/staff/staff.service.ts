import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, schema, type Database } from '@smartdine/db';
import { DATABASE } from '../database/lib/definitions';
import type { UpdateStaffRoleDto } from './dto/update-staff-role.dto';
import type { UpsertStaffRoleDto } from './dto/upsert-staff-role.dto';

@Injectable()
export class StaffService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getMyRestaurants(userId: string) {
    return await this.db.query.staffRoles.findMany({
      where: (staffRoles) => eq(staffRoles.userId, userId),
      with: {
        restaurant: {
          columns: {
            id: true,
            name: true,
            description: true,
            address: true,
            phone: true,
            images: true,
          },
        },
      },
    });
  }

  async getRestaurantStaff(restaurantId: string) {
    await this.assertRestaurantExists(restaurantId);

    return await this.db.query.staffRoles.findMany({
      where: (staffRoles) => eq(staffRoles.restaurantId, restaurantId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });
  }

  async addStaffRole(restaurantId: string, dto: UpsertStaffRoleDto) {
    await this.assertRestaurantExists(restaurantId);

    const user = await this.db.query.users.findFirst({
      columns: {
        id: true,
      },
      where: (users) => eq(users.id, dto.userId),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.db.query.staffRoles.findFirst({
      columns: {
        id: true,
      },
      where: (staffRoles) =>
        and(eq(staffRoles.restaurantId, restaurantId), eq(staffRoles.userId, dto.userId)),
    });

    if (existing) {
      throw new BadRequestException('User is already assigned to this restaurant');
    }

    const [created] = await this.db
      .insert(schema.staffRoles)
      .values({
        restaurantId,
        userId: dto.userId,
        role: dto.role,
      })
      .returning();

    return created;
  }

  async updateStaffRole(restaurantId: string, staffRoleId: string, dto: UpdateStaffRoleDto) {
    const existing = await this.getStaffRoleOrThrow(restaurantId, staffRoleId);

    if (existing.role === 'owner' && dto.role !== 'owner') {
      await this.assertHasMultipleOwners(restaurantId);
    }

    const [updated] = await this.db
      .update(schema.staffRoles)
      .set({
        role: dto.role,
      })
      .where(eq(schema.staffRoles.id, staffRoleId))
      .returning();

    return updated;
  }

  async removeStaffRole(restaurantId: string, staffRoleId: string) {
    const existing = await this.getStaffRoleOrThrow(restaurantId, staffRoleId);

    if (existing.role === 'owner') {
      await this.assertHasMultipleOwners(restaurantId);
    }

    const [deleted] = await this.db
      .delete(schema.staffRoles)
      .where(eq(schema.staffRoles.id, staffRoleId))
      .returning();

    return deleted;
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

  private async getStaffRoleOrThrow(restaurantId: string, staffRoleId: string) {
    const staffRole = await this.db.query.staffRoles.findFirst({
      where: (staffRoles) =>
        and(eq(staffRoles.id, staffRoleId), eq(staffRoles.restaurantId, restaurantId)),
    });

    if (!staffRole) {
      throw new NotFoundException('Staff assignment not found');
    }

    return staffRole;
  }

  private async assertHasMultipleOwners(restaurantId: string) {
    const owners = await this.db.query.staffRoles.findMany({
      columns: {
        id: true,
      },
      where: (staffRoles) =>
        and(eq(staffRoles.restaurantId, restaurantId), eq(staffRoles.role, 'owner')),
    });

    if (owners.length <= 1) {
      throw new BadRequestException('Restaurant must always have at least one owner');
    }
  }
}
