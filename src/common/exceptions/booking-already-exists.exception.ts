import { ConflictException } from '@nestjs/common';

export class BookingAlreadyExistsException extends ConflictException {
  constructor() {
    super('Selected time slot is already booked.');
  }
}
