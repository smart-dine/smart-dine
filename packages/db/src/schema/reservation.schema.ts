import { integer, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { restaurants, restaurantTables, users } from '.';
import { relations } from 'drizzle-orm';
import { text } from 'drizzle-orm/pg-core';

export const reservationStatusValues = ['pending', 'confirmed', 'cancelled', 'completed'] as const;
export const reservationStatusEnum = pgEnum('reservation_status', reservationStatusValues);

export const reservations = pgTable('reservations', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id')
    .notNull()
    .references(() => restaurants.id, { onDelete: 'cascade' }),
  tableId: uuid('table_id')
    .notNull()
    .references(() => restaurantTables.id, { onDelete: 'restrict' }),
  customerId: text('customer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  reservationTime: timestamp('reservation_time').notNull(),
  partySize: integer('party_size').notNull(),
  status: reservationStatusEnum('status').default('pending').notNull(),
});

export const reservationsRelations = relations(reservations, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [reservations.restaurantId],
    references: [restaurants.id],
  }),
  table: one(restaurantTables, {
    fields: [reservations.tableId],
    references: [restaurantTables.id],
  }),
  customer: one(users, {
    fields: [reservations.customerId],
    references: [users.id],
  }),
}));
