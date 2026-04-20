import { createQueryKeyFactory } from './create-key-factory';

export const reservationKeys = createQueryKeyFactory('reservations', {
  availability: (filters: { restaurantId: string; from: string; partySize: number }) => [
    'availability',
    filters,
  ],
});
