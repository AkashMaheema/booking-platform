import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { BookingStatus } from '@prisma/client';

/**
 * Query parameters for GET /bookings — extends base pagination with
 * booking-specific search, sortBy, status, serviceId, and bookingDate filters.
 */
export class BookingQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Case-insensitive search matched against customerName, customerEmail, or customerPhone',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ['bookingDate', 'bookingTime', 'createdAt', 'status'],
    default: 'bookingDate',
    example: 'bookingDate',
  })
  @IsOptional()
  @IsString()
  @IsIn(['bookingDate', 'bookingTime', 'createdAt', 'status'])
  sortBy?: 'bookingDate' | 'bookingTime' | 'createdAt' | 'status' = 'bookingDate';

  @ApiPropertyOptional({
    description: 'Filter by booking status',
    enum: BookingStatus,
    example: 'PENDING',
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({
    description: 'Filter by specific service ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific booking date (ISO format: YYYY-MM-DD)',
    example: '2026-08-01',
  })
  @IsOptional()
  @IsDateString()
  bookingDate?: string;
}
