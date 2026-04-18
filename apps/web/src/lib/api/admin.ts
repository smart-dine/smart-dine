import { queryOptions } from '@tanstack/react-query';
import type {
  AdminRestaurant,
  AdminUser,
  CreateAdminRestaurantInput,
  DeleteRestaurantResult,
  PaginationQueryInput,
  StaffRoleAssignment,
  UpdateRestaurantOwnerInput,
} from './contracts';
import { apiRequest } from './http';
import { queryKeys } from './query-keys';

export interface AdminUsersQuery extends PaginationQueryInput {}

const normalizeUserQuery = (query: AdminUsersQuery) => ({
  search: query.search,
  offset: query.offset ?? 0,
  limit: query.limit ?? 20,
});

export const getAdminRestaurants = () => apiRequest<AdminRestaurant[]>('/admin/restaurants');

export const getAdminUsers = (query: AdminUsersQuery = {}) =>
  apiRequest<AdminUser[]>('/admin/users', {
    query: normalizeUserQuery(query),
  });

export const createAdminRestaurant = (input: CreateAdminRestaurantInput) =>
  apiRequest<AdminRestaurant>('/admin/restaurants', {
    method: 'POST',
    body: input,
  });

export const deleteAdminRestaurant = (restaurantId: string) =>
  apiRequest<DeleteRestaurantResult>(`/admin/restaurants/${restaurantId}`, {
    method: 'DELETE',
  });

export const updateRestaurantOwner = (restaurantId: string, input: UpdateRestaurantOwnerInput) =>
  apiRequest<StaffRoleAssignment>(`/admin/restaurants/${restaurantId}/owner`, {
    method: 'PATCH',
    body: input,
  });

export const removeRestaurantOwner = (restaurantId: string, ownerUserId: string) =>
  apiRequest<StaffRoleAssignment>(`/admin/restaurants/${restaurantId}/owners/${ownerUserId}`, {
    method: 'DELETE',
  });

export const adminQueryOptions = {
  restaurants: () =>
    queryOptions({
      queryKey: queryKeys.admin.restaurants(),
      queryFn: getAdminRestaurants,
    }),
  users: (query: AdminUsersQuery = {}) => {
    const normalized = normalizeUserQuery(query);

    return queryOptions({
      queryKey: queryKeys.admin.users(normalized),
      queryFn: () => getAdminUsers(normalized),
    });
  },
};
