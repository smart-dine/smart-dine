import { relations } from 'drizzle-orm';
import { text, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { menuItems } from '.';
import { restaurants } from '.';
import { uuid } from 'drizzle-orm/pg-core';

export const menuItemCategories = pgTable('menu_item_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id')
    .notNull()
    .references(() => restaurants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
});

export const menuItemsToCategories = pgTable(
  'menu_items_to_categories',
  {
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItems.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => menuItemCategories.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.menuItemId, table.categoryId] }),
  }),
);

export const menuItemCategoriesRelations = relations(menuItemCategories, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [menuItemCategories.restaurantId],
    references: [restaurants.id],
  }),
  items: many(menuItemsToCategories),
}));

export const menuItemsToCategoriesRelations = relations(menuItemsToCategories, ({ one }) => ({
  item: one(menuItems, {
    fields: [menuItemsToCategories.menuItemId],
    references: [menuItems.id],
  }),
  category: one(menuItemCategories, {
    fields: [menuItemsToCategories.categoryId],
    references: [menuItemCategories.id],
  }),
}));
