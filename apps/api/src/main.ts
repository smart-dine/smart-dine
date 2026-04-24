import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // Better Auth
  });

  // Enable body parsing for non-multipart requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.is('application/json')) {
      return json()(req, res, next);
    }

    if (req.is('application/x-www-form-urlencoded')) {
      return urlencoded({ extended: true })(req, res, next);
    }

    next();
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    defaultVersion: '1',
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SmartDine API')
    .setDescription(
      'Role-based API for restaurants, reservations, orders, staff operations, and system administration.',
    )
    .setVersion('1.0.0')
    .addCookieAuth('better-auth.session_token', { type: 'apiKey', in: 'cookie' }, 'session-cookie')
    .setExternalDoc('Better Auth API', '/api/auth/reference')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
