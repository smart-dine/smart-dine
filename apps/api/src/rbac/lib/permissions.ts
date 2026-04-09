import { schema } from '@smartdine/db';

export const rbacPermissions = [
  'restaurant:read',
  'restaurant:update',
  'menu:manage',
  'orders:manage',
  'reservations:manage',
  'staff:manage',
  'system:admin',
] as const;

export type RbacPermission = (typeof rbacPermissions)[number];
export type RestaurantRole = (typeof schema.staffRoleValues)[number];
export type UserRole = (typeof schema.userRoles)[number];

const userRolesSet = new Set(schema.userRoles);
const restaurantRolesSet = new Set(schema.staffRoleValues);

const userRolePermissions: Record<UserRole, readonly RbacPermission[]> = {
  admin: rbacPermissions,
  user: [],
};

const restaurantRolePermissions: Record<RestaurantRole, readonly RbacPermission[]> = {
  owner: [
    'restaurant:read',
    'restaurant:update',
    'menu:manage',
    'orders:manage',
    'reservations:manage',
    'staff:manage',
  ],
  employee: ['restaurant:read', 'orders:manage', 'reservations:manage'],
};

const hasAllPermissions = (
  grantedPermissions: readonly RbacPermission[],
  requiredPermissions: readonly RbacPermission[],
) => requiredPermissions.every((permission) => grantedPermissions.includes(permission));

export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && userRolesSet.has(value as UserRole);

export const isRestaurantRole = (value: unknown): value is RestaurantRole =>
  typeof value === 'string' && restaurantRolesSet.has(value as RestaurantRole);

export const normalizeUserRole = (value: unknown): UserRole => {
  if (Array.isArray(value)) {
    const matchingRole = value.find((role) => isUserRole(role));
    return matchingRole ?? 'user';
  }

  if (isUserRole(value)) {
    return value;
  }

  return 'user';
};

export const userRoleHasPermissions = (
  role: UserRole,
  requiredPermissions: readonly RbacPermission[],
): boolean => hasAllPermissions(userRolePermissions[role], requiredPermissions);

export const restaurantRoleHasPermissions = (
  role: RestaurantRole,
  requiredPermissions: readonly RbacPermission[],
): boolean => hasAllPermissions(restaurantRolePermissions[role], requiredPermissions);
