import { HttpException, HttpStatus } from '@nestjs/common';

export abstract class BaseBusinessException extends HttpException {
  public readonly errorCode: string;

  constructor(message: string, errorCode: string, statusCode: HttpStatus) {
    super(
      {
        message,
        errorCode,
        statusCode,
      },
      statusCode,
    );
    this.errorCode = errorCode;
  }
}
