import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDatabase } from '@smartdine/db';
import { DATABASE } from './lib/definitions';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.getOrThrow<string>('DATABASE_URL');
        if (connectionString.startsWith('neon')) {
          return createDatabase(connectionString, 'neon');
        }
        return createDatabase(connectionString, 'postgresql');
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
