import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import configuration from './config/configuration';
import { validationSchema } from './config/validation';

import { PrismaModule } from './database/prisma.module';
import { LoggerModule } from './logger/logger.module';

import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ServicesModule } from './modules/services/services.module';
import { BookingsModule } from './modules/bookings/bookings.module';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [
    // Configuration — must be first, validates env on startup
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
      expandVariables: true,
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        {
          ttl: parseInt(process.env['THROTTLE_TTL'] ?? '60', 10) * 1000,
          limit: parseInt(process.env['THROTTLE_LIMIT'] ?? '100', 10),
        },
      ],
    }),

    // Infrastructure
    PrismaModule,
    LoggerModule,

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    BookingsModule,
  ],

  providers: [
    // Global exception filters — order matters: specific before generic
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

    // Global response transform
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },

    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
