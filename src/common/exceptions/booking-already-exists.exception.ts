import { HttpStatus } from '@nestjs/common';
import { BaseBusinessException } from './base-business.exception';

export class BookingAlreadyExistsException extends BaseBusinessException {
  constructor(message: string = 'BookingAlreadyExists error') {
    super(message, 'BOOKING_ALREADY_EXISTS_ERR', HttpStatus.CONFLICT);
  }
}
