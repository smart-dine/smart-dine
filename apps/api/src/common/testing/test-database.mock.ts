/**
 * Test utilities for mocking Drizzle ORM database operations.
 * This file provides helpers to create mocked database instances for unit testing.
 */

import type { Database } from '@smartdine/db';
import { DATABASE } from '../../database/lib/definitions';

/**
 * Creates a mock database provider for testing.
 * Provides methods to mock query operations and transactions.
 */
export function createMockDatabaseProvider() {
  const mockTransaction = jest.fn();
  const mockQuery = {
    restaurants: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    menuItems: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    menuItemCategories: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    menuItemsToCategories: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    restaurantTables: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    orders: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    orderItems: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    reservations: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    staffRoles: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    users: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockInsert = jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest.fn(),
    }),
  });

  const mockUpdate = jest.fn().mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn(),
      }),
    }),
  });

  const mockDelete = jest.fn().mockReturnValue({
    where: jest.fn().mockReturnValue({
      returning: jest.fn(),
    }),
  });

  const mockDb = {
    query: mockQuery,
    transaction: mockTransaction,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    select: jest.fn(),
  } as unknown as Database;

  return {
    provider: {
      provide: DATABASE,
      useValue: mockDb,
    },
    mockDb,
    mockQuery,
    mockTransaction,
  };
}

/**
 * Creates a mock database transaction helper for testing transaction operations.
 * Returns a mock transaction callback with insert, update, delete, and query operations.
 */
export function createMockDatabaseTransaction() {
  const mockInsert = jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest.fn(),
    }),
  });

  const mockUpdate = jest.fn().mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn(),
      }),
    }),
  });

  const mockDelete = jest.fn().mockReturnValue({
    where: jest.fn().mockReturnValue({
      returning: jest.fn(),
    }),
  });

  const mockTxQuery = {
    restaurants: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    menuItems: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    menuItemCategories: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    menuItemsToCategories: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    restaurantTables: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    orders: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    orderItems: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    reservations: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    staffRoles: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    users: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockTx = {
    query: mockTxQuery,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  };

  return {
    mockTx: mockTx as unknown as Database,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockTxQuery,
  };
}
