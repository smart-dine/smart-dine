import type { Request } from 'express';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { RbacPermission } from './permissions';

export interface AuthenticatedRequest extends Request {
  session?: UserSession;
}

export interface RestaurantContextOptions {
  restaurantIdParam?: string;
  restaurantIdBody?: string;
  restaurantIdQuery?: string;
  requireRestaurantContext?: boolean;
}

export interface PermissionCheckInput {
  session: UserSession;
  permissions: readonly RbacPermission[];
  restaurantId?: string;
}
