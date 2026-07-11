import { HttpStatus } from '@nestjs/common';
import { BaseBusinessException } from './base-business.exception';

export class InvalidBookingDateException extends BaseBusinessException {
  constructor(message: string = 'InvalidBookingDate error') {
    super(message, 'INVALID_BOOKING_DATE_ERR', HttpStatus.BAD_REQUEST);
  }
}
