import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createDatabase, schema } from '@smartdine/db';
import { openAPI } from 'better-auth/plugins';

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`${key} is not defined`);
  }
  return value || '';
};

export const auth = betterAuth({
  baseURL: getEnv('BETTER_AUTH_URL'),
  database: drizzleAdapter(createDatabase(getEnv('DATABASE_URL'), 'postgresql'), {
    provider: 'pg',
    schema,
    usePlural: true,
  }),
  trustedOrigins: [...(getEnv('CORS_ORIGIN')?.split(',') ?? [])],
  plugins: [openAPI()],
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: getEnv('CORS_DOMAIN') || 'localhost',
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      enabled: true,
      clientId: getEnv('GOOGLE_CLIENT_ID'),
      clientSecret: getEnv('GOOGLE_CLIENT_SECRET'),
      accessType: 'offline',
      prompt: 'select_account consent',
    },
    github: {
      enabled: true,
      clientId: getEnv('GITHUB_CLIENT_ID'),
      clientSecret: getEnv('GITHUB_CLIENT_SECRET'),
    },
  },
});
