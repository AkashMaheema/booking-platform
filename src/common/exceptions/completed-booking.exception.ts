import { HttpStatus } from '@nestjs/common';
import { BaseBusinessException } from './base-business.exception';

export class CompletedBookingException extends BaseBusinessException {
  constructor(message: string = 'CompletedBooking error') {
    super(message, 'COMPLETED_BOOKING_ERR', HttpStatus.CONFLICT);
  }
}
