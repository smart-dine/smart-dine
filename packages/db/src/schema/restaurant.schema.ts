import { relations } from 'drizzle-orm';
import { doublePrecision, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { menuItems, orders, reservations, staffRoles } from '.';
import { uuid } from 'drizzle-orm/pg-core';
import { jsonb } from 'drizzle-orm/pg-core';

export const tableShapeValues = ['round', 'rectangle'] as const;
export const tableShapeEnum = pgEnum('table_shape', tableShapeValues);

export const restaurants = pgTable('restaurants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  openingHours: jsonb('opening_hours')
    .$type<{
      [key in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']: {
        opens: string; // "09:00"
        closes: string; // "22:00"
        isClosed: boolean;
      };
    }>()
    .notNull(),
  images: text('images').array().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const restaurantTables = pgTable('restaurant_tables', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id')
    .notNull()
    .references(() => restaurants.id, { onDelete: 'cascade' }),
  tableNumber: text('table_number').notNull(),
  capacity: integer('capacity').notNull(),
  xCoordinate: doublePrecision('x_coordinate').notNull(),
  yCoordinate: doublePrecision('y_coordinate').notNull(),
  shape: tableShapeEnum('shape').notNull(),
});

export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  staffRoles: many(staffRoles),
  tables: many(restaurantTables),
  reservations: many(reservations),
  menuItems: many(menuItems),
  orders: many(orders),
}));

export const restaurantTablesRelations = relations(restaurantTables, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [restaurantTables.restaurantId],
    references: [restaurants.id],
  }),
  reservations: many(reservations),
  orders: many(orders),
}));
