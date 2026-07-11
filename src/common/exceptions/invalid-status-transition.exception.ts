import { ConflictException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

export class InvalidStatusTransitionException extends ConflictException {
  constructor(currentStatus: BookingStatus, newStatus: BookingStatus) {
    super(`Booking status transition from ${currentStatus} to ${newStatus} is not allowed.`);
  }
}
