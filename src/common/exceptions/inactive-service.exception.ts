import { HttpStatus } from '@nestjs/common';
import { BaseBusinessException } from './base-business.exception';

export class InactiveServiceException extends BaseBusinessException {
  constructor(message: string = 'InactiveService error') {
    super(message, 'INACTIVE_SERVICE_ERR', HttpStatus.CONFLICT);
  }
}
