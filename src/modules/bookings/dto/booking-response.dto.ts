import { ApiProperty } from '@nestjs/swagger';
import { Booking, BookingStatus, Service } from '@prisma/client';

export class BookingResponseDto {
  @ApiProperty({ example: 'uuid-1234', description: 'The unique identifier of the booking' })
  id!: string;
  @ApiProperty({ example: 'John Doe', description: 'The full name of the customer' })
  customerName!: string;
  @ApiProperty({ example: 'john@example.com', description: 'The email of the customer' })
  customerEmail!: string;
  @ApiProperty({ example: '+60123456789', description: 'The phone number of the customer' })
  customerPhone!: string;
  @ApiProperty({ description: 'The subset of the booked service', required: false })
  service!: { id: string; title: string; duration: number; price: number } | undefined;
  @ApiProperty({
    example: '2026-08-20',
    description: 'The date of the booking in ISO format (YYYY-MM-DD)',
  })
  bookingDate!: string;
  @ApiProperty({ example: '14:00', description: 'The time of the booking in HH:mm format' })
  bookingTime!: string;
  @ApiProperty({
    enum: BookingStatus,
    example: BookingStatus.PENDING,
    description: 'The current status of the booking',
  })
  status!: BookingStatus;
  @ApiProperty({
    example: 'Please arrive early.',
    description: 'Optional notes for the booking',
    required: false,
    nullable: true,
  })
  notes!: string | null;
  @ApiProperty({ example: '2026-07-11T12:00:00Z', description: 'Creation timestamp' })
  createdAt!: Date;

  constructor(booking: Booking & { service?: Pick<Service, 'id' | 'title' | 'duration' | 'price'> }) {
    this.id = booking.id;
    this.customerName = booking.customerName;
    this.customerEmail = booking.customerEmail;
    this.customerPhone = booking.customerPhone;

    // We only expose a safe subset of the Service if it was joined
    if (booking.service) {
      this.service = {
        id: booking.service.id,
        title: booking.service.title,
        duration: booking.service.duration,
        price: Number(booking.service.price),
      };
    }

    // Convert Date to string YYYY-MM-DD
    this.bookingDate = booking.bookingDate.toISOString().split('T')[0];
    this.bookingTime = booking.bookingTime;
    this.status = booking.status;
    this.notes = booking.notes;
    this.createdAt = booking.createdAt;
  }
}
