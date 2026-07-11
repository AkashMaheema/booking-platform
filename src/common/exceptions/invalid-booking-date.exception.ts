import { BadRequestException } from '@nestjs/common';

export class InvalidBookingDateException extends BadRequestException {
  constructor(message: string = 'Booking date cannot be in the past.') {
    super(message);
  }
}
