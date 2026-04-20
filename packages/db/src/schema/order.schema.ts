import { integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { menuItems, restaurants, restaurantTables, users } from '.';
import { relations } from 'drizzle-orm';
import { uuid } from 'drizzle-orm/pg-core';

export const orderStatusValues = ['placed', 'completed'] as const;
export const orderStatusEnum = pgEnum('order_status', orderStatusValues);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id')
    .notNull()
    .references(() => restaurants.id, { onDelete: 'cascade' }),
  tableId: uuid('table_id')
    .notNull()
    .references(() => restaurantTables.id, { onDelete: 'restrict' }),
  operatorId: text('operator_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  status: orderStatusEnum('status').default('placed').notNull(),
  totalAmount: integer('total_amount').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  menuItemId: uuid('menu_item_id')
    .notNull()
    .references(() => menuItems.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  specialInstructions: text('special_instructions'),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [orders.restaurantId],
    references: [restaurants.id],
  }),
  table: one(restaurantTables, {
    fields: [orders.tableId],
    references: [restaurantTables.id],
  }),
  operator: one(users, {
    fields: [orders.operatorId],
    references: [users.id],
  }),
  orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));
