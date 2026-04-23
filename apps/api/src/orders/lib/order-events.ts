export const ORDER_CREATED_EVENT = 'orders.created';
export const ORDER_STATUS_UPDATED_EVENT = 'orders.status.updated';
export const ORDER_COMPLETED_EVENT = 'orders.completed';
export const ORDER_ITEMS_UPDATED_EVENT = 'orders.items.updated';

export interface OrderSocketEventPayload<T = unknown> {
  restaurantId: string;
  payload: T;
}
