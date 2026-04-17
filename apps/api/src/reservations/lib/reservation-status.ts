export const reservationStatuses = ['pending', 'confirmed', 'cancelled', 'completed'] as const;

export type ReservationStatus = (typeof reservationStatuses)[number];
