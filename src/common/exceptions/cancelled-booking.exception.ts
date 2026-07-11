import { HttpStatus } from '@nestjs/common';
import { BaseBusinessException } from './base-business.exception';

export class CancelledBookingException extends BaseBusinessException {
  constructor(message: string = 'CancelledBooking error') {
    super(message, 'CANCELLED_BOOKING_ERR', HttpStatus.CONFLICT);
  }
}
