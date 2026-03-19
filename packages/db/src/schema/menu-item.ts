import { relations } from 'drizzle-orm';
import { text, integer, boolean, pgTable } from 'drizzle-orm/pg-core';
import { orderItems } from '.';
import { restaurants } from '.';
import { uuid } from 'drizzle-orm/pg-core';

export const menuItems = pgTable('menu_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id')
    .notNull()
    .references(() => restaurants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  image: text('image'),
});

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [menuItems.restaurantId],
    references: [restaurants.id],
  }),
  orderItems: many(orderItems),
}));
