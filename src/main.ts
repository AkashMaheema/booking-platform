import { NestFactory } from '@nestjs/core';
import { LoggerService } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression') as () => unknown;

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // Suppress default NestJS logger — Winston takes over
    bufferLogs: true,
  });

  // ─── Logger ──────────────────────────────────────────────────────────────────
  const logger = app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  // ─── Security ────────────────────────────────────────────────────────────────
  app.use(helmet());
  app.enableCors({
    origin: process.env['CORS_ORIGIN']?.split(',') ?? ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ─── Performance ─────────────────────────────────────────────────────────────
  app.use(compression());

  // ─── Global Prefix ───────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1', {
    exclude: ['health'], // Health endpoint at /health (no prefix)
  });

  // Validation Pipe is now configured globally in AppModule via APP_PIPE

  // ─── Swagger ─────────────────────────────────────────────────────────────────
  // ─── Swagger ─────────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
      .setTitle('EN2H Booking Platform API')
      .setDescription(
        'Production-ready REST API built with NestJS, Prisma, PostgreSQL, and JWT Authentication.\n\nThis API allows authenticated users to manage services and customers to create bookings.\n\nCreated as part of the EN2H Software Engineer Intern Technical Assignment.',
      )
      .setVersion('1.0.0')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter your JWT access token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Health', 'Application health check endpoints')
      .addTag('Auth', 'Authentication endpoints (register, login, refresh, logout)')
      .addTag('Services', 'Service management endpoints')
      .addTag('Bookings', 'Booking management endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      jsonDocumentUrl: 'api/docs-json',
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

  // ─── Start ───────────────────────────────────────────────────────────────────
  const port = parseInt(process.env['PORT'] ?? '3000', 10);
  await app.listen(port);

  logger.log(`🚀 Application running on: http://localhost:${port}/api/v1`, 'Bootstrap');
  logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`, 'Bootstrap');
  logger.log(`🏥 Health check: http://localhost:${port}/health`, 'Bootstrap');
  logger.log(`🌍 Environment: ${process.env['NODE_ENV'] ?? 'development'}`, 'Bootstrap');
}

bootstrap().catch((err: unknown) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
