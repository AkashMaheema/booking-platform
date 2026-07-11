import { ConflictException } from '@nestjs/common';

export class InactiveServiceException extends ConflictException {
  constructor() {
    super('Selected service is currently unavailable.');
  }
}
