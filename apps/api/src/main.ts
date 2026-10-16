import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { Express } from 'express';
import { AppModule } from './app.module.js';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const expressApp = app.getHttpAdapter().getInstance() as Express;
  // Security Gate Clarification 3: Explicit trusted proxy policy (loopback and internal proxies)
  expressApp.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

  // HTTP Security Headers
  app.use(helmet());

  // Cookie parsing for HttpOnly session and CSRF tokens
  app.use(cookieParser(process.env['SESSION_COOKIE_SECRET']));

  // Cross-Origin Resource Sharing
  app.enableCors({
    origin: process.env['WEB_URL'] ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Skyra-Org-ID'],
  });

  // Strict Request Body Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env['API_PORT'] ?? 4000);
  if (process.env['NODE_ENV'] !== 'test') {
    await app.listen(port);
  }

  return app;
}

if (process.env['NODE_ENV'] !== 'test') {
  void bootstrap();
}
