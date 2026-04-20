import { queryOptions } from '@tanstack/react-query';
import type {
  CreateReservationInput,
  ReservationAvailabilityQueryInput,
  RestaurantReservationAvailability,
  ReservationStatusUpdated,
  RestaurantReservation,
  UpdateReservationStatusInput,
} from './contracts';
import { apiRequest } from './http';
import { queryKeys } from './query-keys';

export const getRestaurantReservationAvailability = (
  restaurantId: string,
  query: ReservationAvailabilityQueryInput,
) =>
  apiRequest<RestaurantReservationAvailability>(`/restaurants/${restaurantId}/availability`, {
    query,
  });

export const createRestaurantReservation = (restaurantId: string, input: CreateReservationInput) =>
  apiRequest<ReservationStatusUpdated>(`/restaurants/${restaurantId}/reservations`, {
    method: 'POST',
    body: input,
  });

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
  availability: (restaurantId: string, query: ReservationAvailabilityQueryInput, enabled = true) =>
    queryOptions({
      queryKey: queryKeys.restaurants.reservationAvailability(restaurantId, query),
      queryFn: () => getRestaurantReservationAvailability(restaurantId, query),
      enabled: Boolean(restaurantId) && enabled,
    }),
  restaurantReservations: (restaurantId: string) =>
    queryOptions({
      queryKey: queryKeys.restaurants.reservations(restaurantId),
      queryFn: () => getRestaurantReservations(restaurantId),
      enabled: Boolean(restaurantId),
    }),
};
