import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: false, description: 'Indicates if the request was successful' })
  success!: boolean;

  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode!: number;

  @ApiProperty({ example: 'Bad Request', description: 'Error message' })
  message!: string;

  @ApiPropertyOptional({
    example: [{ field: 'price', message: 'price must be greater than 0' }],
    description: 'Detailed validation errors',
  })
  errors?: Record<string, unknown>[];

  @ApiProperty({ example: '2026-07-12T10:30:00Z', description: 'Timestamp of the error' })
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/services', description: 'Request path where error occurred' })
  path!: string;

  @ApiProperty({ example: 'req-1234', description: 'Unique request identifier' })
  requestId!: string;
}
