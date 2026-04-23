export const orderStatuses = ['placed', 'completed'] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const orderItemStatuses = ['placed', 'completed'] as const;

export type OrderItemStatus = (typeof orderItemStatuses)[number];
