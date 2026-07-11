import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID, IsIn } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { BookingStatus } from '@prisma/client';

export class BookingQueryDto extends PaginationQueryDto {

  @ApiPropertyOptional({ description: 'Search term for customer details' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: any }) => typeof value === 'string' ? value.trim() : value)
  search?: string;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['bookingDate', 'bookingTime', 'createdAt', 'status'], default: 'bookingDate' })
  @IsOptional()
  @IsString()
  @IsIn(['bookingDate', 'bookingTime', 'createdAt', 'status'])
  sortBy?: 'bookingDate' | 'bookingTime' | 'createdAt' | 'status' = 'bookingDate';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
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
