export const orderStatuses = ['placed', 'completed'] as const;

export type OrderStatus = (typeof orderStatuses)[number];
