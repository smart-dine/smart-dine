import { Inject, Injectable } from '@nestjs/common';
import { and, eq, type Database } from '@smartdine/db';
import { DATABASE } from '../database/lib/definitions';
import {
  isRestaurantRole,
  normalizeUserRole,
  restaurantRoleHasPermissions,
  type RestaurantRole,
  type UserRole,
  userRoleHasPermissions,
} from './lib/permissions';
import type { PermissionCheckInput } from './lib/types';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@Injectable()
export class RbacService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  getSessionUserRole(session: UserSession): UserRole {
    return normalizeUserRole(session.user.role);
  }

  async getRestaurantRole(userId: string, restaurantId: string): Promise<RestaurantRole | null> {
    const staffMember = await this.db.query.staffRoles.findFirst({
      columns: {
        role: true,
      },
      where: (staffRoles) => and(eq(staffRoles.userId, userId), eq(staffRoles.restaurantId, restaurantId)),
    });

    if (!staffMember) {
      return null;
    }

    return isRestaurantRole(staffMember.role) ? staffMember.role : null;
  }

  async hasPermissions({ session, permissions, restaurantId }: PermissionCheckInput): Promise<boolean> {
    if (permissions.length === 0) {
      return true;
    }

    const userRole = this.getSessionUserRole(session);
    if (userRoleHasPermissions(userRole, permissions)) {
      return true;
    }

    if (!restaurantId) {
      return false;
    }

    const restaurantRole = await this.getRestaurantRole(session.user.id, restaurantId);
    if (!restaurantRole) {
      return false;
    }

    return restaurantRoleHasPermissions(restaurantRole, permissions);
  }
}
