import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { RbacGuard } from '../rbac.guard';
import { RBAC_CONTEXT_OPTIONS_KEY, RBAC_PERMISSIONS_KEY } from '../rbac.constants';
import type { RbacPermission } from '../lib/permissions';
import type { RestaurantContextOptions } from '../lib/types';

export const RequirePermissions = (
  permissions: readonly RbacPermission[],
  options: RestaurantContextOptions = {},
) =>
  applyDecorators(
    SetMetadata(RBAC_PERMISSIONS_KEY, permissions),
    SetMetadata(RBAC_CONTEXT_OPTIONS_KEY, options),
    UseGuards(RbacGuard),
  );

export const RequireRestaurantPermissions = (
  permissions: readonly RbacPermission[],
  options: Omit<RestaurantContextOptions, 'requireRestaurantContext'> = {},
) =>
  RequirePermissions(permissions, {
    ...options,
    requireRestaurantContext: true,
  });
