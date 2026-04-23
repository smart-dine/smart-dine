import { queryOptions } from '@tanstack/react-query';
import type {
  CreateOrderInput,
  OrderStatus,
  RestaurantOrder,
  RestaurantOrderStatusPatch,
  UpdateOrderItemStatusInput,
  UpdateOrderStatusInput,
} from './contracts';
import { apiRequest } from './http';
import { queryKeys } from './query-keys';

export interface RestaurantOrdersQuery {
  status?: OrderStatus;
}

const normalizeOrderQuery = (query: RestaurantOrdersQuery) => ({
  status: query.status,
});

export const getRestaurantOrders = (restaurantId: string, query: RestaurantOrdersQuery = {}) =>
  apiRequest<RestaurantOrder[]>(`/restaurants/${restaurantId}/orders`, {
    query: normalizeOrderQuery(query),
  });

export const updateOrderStatus = (orderId: string, input: UpdateOrderStatusInput) =>
  apiRequest<RestaurantOrderStatusPatch>(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: input,
  });

export const updateOrderItemStatus = (
  orderId: string,
  orderItemId: string,
  input: UpdateOrderItemStatusInput,
) =>
  apiRequest<RestaurantOrder>(`/orders/${orderId}/items/${orderItemId}/status`, {
    method: 'PATCH',
    body: input,
  });

export const createRestaurantOrder = (restaurantId: string, input: CreateOrderInput) =>
  apiRequest<RestaurantOrder>(`/restaurants/${restaurantId}/orders`, {
    method: 'POST',
    body: input,
  });

export const ordersQueryOptions = {
  restaurantOrders: (restaurantId: string, query: RestaurantOrdersQuery = {}) => {
    const normalized = normalizeOrderQuery(query);

    return queryOptions({
      queryKey: queryKeys.restaurants.orders(restaurantId, normalized),
      queryFn: () => getRestaurantOrders(restaurantId, normalized),
      enabled: Boolean(restaurantId),
    });
  },
};
