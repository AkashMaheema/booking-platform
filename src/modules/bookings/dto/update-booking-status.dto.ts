import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingStatusDto {
  @ApiProperty({
    example: BookingStatus.CONFIRMED,
    description: 'The new status of the booking',
    enum: BookingStatus,
  })
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status!: BookingStatus;
}
