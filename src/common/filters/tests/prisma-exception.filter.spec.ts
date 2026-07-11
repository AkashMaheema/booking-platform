import { PrismaExceptionFilter } from '../prisma-exception.filter';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockGetResponse: jest.Mock;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;
  let mockGetRequest: jest.Mock;

  beforeEach(() => {
    filter = new PrismaExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    mockGetRequest = jest.fn().mockReturnValue({
      method: 'POST',
      url: '/test-prisma',
      id: 'prisma-req-id',
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

  it('should map P2002 to CONFLICT', () => {
    const exception = new Prisma.PrismaClientKnownRequestError('Error', {
      code: 'P2002',
      clientVersion: '1.0',
    });

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: 'A record with this data already exists.',
        requestId: 'prisma-req-id',
      }),
    );
  });

  it('should map P2025 to NOT_FOUND', () => {
    const exception = new Prisma.PrismaClientKnownRequestError('Error', {
      code: 'P2025',
      clientVersion: '1.0',
    });

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('should map P2003 to BAD_REQUEST', () => {
    const exception = new Prisma.PrismaClientKnownRequestError('Error', {
      code: 'P2003',
      clientVersion: '1.0',
    });

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  it('should map unknown known errors to INTERNAL_SERVER_ERROR', () => {
    const exception = new Prisma.PrismaClientKnownRequestError('Error', {
      code: 'P9999',
      clientVersion: '1.0',
    });

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('should map PrismaClientValidationError to UNPROCESSABLE_ENTITY', () => {
    const exception = new Prisma.PrismaClientValidationError('Validation failed', {
      clientVersion: '1.0',
    });

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('should map other Prisma errors to INTERNAL_SERVER_ERROR', () => {
    const exception = new Prisma.PrismaClientUnknownRequestError('Unknown error', {
      clientVersion: '1.0',
    });

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
