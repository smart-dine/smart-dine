import { queryOptions } from '@tanstack/react-query';
import type {
  ReservationStatusUpdated,
  RestaurantReservation,
  UpdateReservationStatusInput,
} from './contracts';
import { apiRequest } from './http';
import { queryKeys } from './query-keys';

export const getRestaurantReservations = (restaurantId: string) =>
  apiRequest<RestaurantReservation[]>(`/restaurants/${restaurantId}/reservations`);

export const updateReservationStatus = (
  reservationId: string,
  input: UpdateReservationStatusInput,
) =>
  apiRequest<ReservationStatusUpdated>(`/reservations/${reservationId}/status`, {
    method: 'PATCH',
    body: input,
  });

export const cancelReservation = (reservationId: string) =>
  apiRequest<ReservationStatusUpdated>(`/reservations/${reservationId}/cancel`, {
    method: 'PATCH',
  });

export const reservationsQueryOptions = {
  restaurantReservations: (restaurantId: string) =>
    queryOptions({
      queryKey: queryKeys.restaurants.reservations(restaurantId),
      queryFn: () => getRestaurantReservations(restaurantId),
      enabled: Boolean(restaurantId),
    }),
};
