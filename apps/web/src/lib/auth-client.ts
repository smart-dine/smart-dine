import { env } from '#/env';
import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: env.VITE_API_URL,
  basePath: env.VITE_API_AUTH_PATH,
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: 'string',
          input: false,
        },
      },
    }),
  ],
});

export type Session = typeof authClient.$Infer.Session;
