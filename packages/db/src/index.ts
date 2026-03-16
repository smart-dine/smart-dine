import { Pool } from 'pg';
import * as schema from './schema';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';

const createDatabase = (connectionString: string, type: 'postgresql' | 'neon' = 'postgresql') => {
  switch (type) {
    case 'postgresql':
      return drizzle({
        client: new Pool({ connectionString }),
        schema,
        casing: 'snake_case',
      });
    case 'neon':
      return drizzleNeon({
        client: neon(connectionString),
        schema,
        casing: 'snake_case',
      });
    default:
      throw new Error(`Unsupported database type: ${type}`);
  }
};

export { schema, createDatabase };
