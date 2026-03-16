import { env } from '#/env';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: env.VITE_API_URL,
  basePath: env.VITE_API_AUTH_PATH,
});

export type Session = typeof authClient.$Infer.Session;
