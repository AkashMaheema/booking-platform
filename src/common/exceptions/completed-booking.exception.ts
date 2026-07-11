import { ConflictException } from '@nestjs/common';

export class CompletedBookingException extends ConflictException {
  constructor() {
    super('Completed bookings cannot be modified or cancelled.');
  }
}
