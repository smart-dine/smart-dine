import { createDatabase } from '@smartdine/db';

export const DATABASE = 'DATABASE_CONNECTION';
export type DrizzleDatabase = ReturnType<typeof createDatabase>;
