import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class BookingQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page (max 100)', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term for customer details' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['bookingDate', 'bookingTime', 'createdAt', 'status'], default: 'bookingDate' })
  @IsOptional()
  @IsString()
  sortBy?: 'bookingDate' | 'bookingTime' | 'createdAt' | 'status' = 'bookingDate';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({ description: 'Filter by booking status', enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Filter by specific service ID' })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Filter by specific booking date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  bookingDate?: string;
}
