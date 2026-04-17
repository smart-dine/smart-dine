export const orderStatuses = ['placed', 'preparing', 'ready', 'completed'] as const;

export type OrderStatus = (typeof orderStatuses)[number];
