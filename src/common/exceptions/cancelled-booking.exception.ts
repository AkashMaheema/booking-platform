import { ConflictException } from '@nestjs/common';

export class CancelledBookingException extends ConflictException {
  constructor() {
    super('Cancelled bookings cannot become completed.');
  }
}
