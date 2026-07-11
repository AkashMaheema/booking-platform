import { GlobalExceptionFilter } from '../global-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseBusinessException } from '../../exceptions/base-business.exception';

class TestBusinessException extends BaseBusinessException {
  constructor() {
    super('Test message', 'TEST_001', HttpStatus.BAD_REQUEST);
  }
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockGetResponse: jest.Mock;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;
  let mockGetRequest: jest.Mock;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    mockGetRequest = jest.fn().mockReturnValue({
      method: 'GET',
      url: '/test',
      id: 'test-req-id',
    });

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException and extract message/errors', () => {
    const exception = new HttpException(
      { message: 'Test HTTP Error', errors: ['error1'] },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Test HTTP Error',
        errors: ['error1'],
        path: '/test',
        requestId: 'test-req-id',
      }),
    );
  });

  it('should handle BaseBusinessException and extract errorCode', () => {
    const exception = new TestBusinessException();

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: 'TEST_001',
        message: 'Test message',
        path: '/test',
        requestId: 'test-req-id',
      }),
    );
  });

  it('should handle generic Error as 500 Internal Server Error', () => {
    const exception = new Error('Generic internal error');

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred. Please try again later.',
        errors: [],
        path: '/test',
        requestId: 'test-req-id',
      }),
    );
  });
});
