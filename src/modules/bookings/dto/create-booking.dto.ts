import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'The full name of the customer',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  customerName!: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email of the customer',
  })
  @IsEmail()
  @IsNotEmpty()
  customerEmail!: string;

  @ApiProperty({
    example: '+60123456789',
    description: 'The phone number of the customer',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'customerPhone must be a valid international phone number',
  })
  customerPhone!: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The UUID of the service being booked',
  })
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({
    example: '2026-08-20',
    description: 'The date of the booking in ISO format (YYYY-MM-DD)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'bookingDate must be in YYYY-MM-DD format',
  })
  bookingDate!: string;

  @ApiProperty({
    example: '14:00',
    description: 'The time of the booking in 24-hour HH:mm format',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'bookingTime must be in HH:mm 24-hour format',
  })
  bookingTime!: string;

  @ApiPropertyOptional({
    example: 'Please arrive early.',
    description: 'Optional notes for the booking',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
