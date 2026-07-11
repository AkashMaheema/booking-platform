import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingsRepository } from './bookings.repository';
import { PrismaModule } from '../../database/prisma.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [PrismaModule, ServicesModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsRepository],
  exports: [BookingsService],
})
export class BookingsModule {}
