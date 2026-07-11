import { HttpStatus } from '@nestjs/common';
import { BaseBusinessException } from './base-business.exception';

export class InvalidStatusTransitionException extends BaseBusinessException {
  constructor(message: string = 'InvalidStatusTransition error') {
    super(message, 'INVALID_STATUS_TRANSITION_ERR', HttpStatus.CONFLICT);
  }
}
