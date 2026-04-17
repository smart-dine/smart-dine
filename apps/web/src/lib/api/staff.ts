import { queryOptions } from '@tanstack/react-query';
import type {
  RestaurantStaffAssignment,
  StaffMembership,
  UpdateStaffRoleInput,
  UpsertStaffRoleInput,
} from './contracts';
import { apiRequest } from './http';
import { queryKeys } from './query-keys';

export const getMyRestaurants = () => apiRequest<StaffMembership[]>('/my/restaurants');

export const getRestaurantStaff = (restaurantId: string) =>
  apiRequest<RestaurantStaffAssignment[]>(`/restaurants/${restaurantId}/staff`);

export const addStaffRole = (restaurantId: string, input: UpsertStaffRoleInput) =>
  apiRequest<RestaurantStaffAssignment>(`/restaurants/${restaurantId}/staff`, {
    method: 'POST',
    body: input,
  });

export const updateStaffRole = (
  restaurantId: string,
  staffRoleId: string,
  input: UpdateStaffRoleInput,
) =>
  apiRequest<RestaurantStaffAssignment>(`/restaurants/${restaurantId}/staff/${staffRoleId}`, {
    method: 'PATCH',
    body: input,
  });

export const removeStaffRole = (restaurantId: string, staffRoleId: string) =>
  apiRequest<RestaurantStaffAssignment>(`/restaurants/${restaurantId}/staff/${staffRoleId}`, {
    method: 'DELETE',
  });

export const staffQueryOptions = {
  myRestaurants: () =>
    queryOptions({
      queryKey: queryKeys.staff.myRestaurants(),
      queryFn: getMyRestaurants,
      retry: false,
    }),
  restaurantStaff: (restaurantId: string) =>
    queryOptions({
      queryKey: queryKeys.staff.restaurantStaff(restaurantId),
      queryFn: () => getRestaurantStaff(restaurantId),
      enabled: Boolean(restaurantId),
    }),
};
