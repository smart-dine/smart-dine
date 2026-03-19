import { pgEnum, pgTable, uuid } from 'drizzle-orm/pg-core';
import { restaurants, users } from '.';
import { relations } from 'drizzle-orm';
import { text } from 'drizzle-orm/pg-core';

export const staffRoleValues = ['owner', 'employee'] as const;
export const staffRoleEnum = pgEnum('staff_role', staffRoleValues);

export const staffRoles = pgTable('staff_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  restaurantId: uuid('restaurant_id')
    .notNull()
    .references(() => restaurants.id, { onDelete: 'cascade' }),
  role: staffRoleEnum('role').default('employee').notNull(),
});

export const staffRolesRelations = relations(staffRoles, ({ one }) => ({
  user: one(users, {
    fields: [staffRoles.userId],
    references: [users.id],
  }),
  restaurant: one(restaurants, {
    fields: [staffRoles.restaurantId],
    references: [restaurants.id],
  }),
}));
