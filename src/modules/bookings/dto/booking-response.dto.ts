import { Booking, BookingStatus, Service } from '@prisma/client';

export class BookingResponseDto {
  id!: string;
  customerName!: string;
  customerEmail!: string;
  customerPhone!: string;
  service!: any;
  bookingDate!: string;
  bookingTime!: string;
  status!: BookingStatus;
  notes!: string | null;
  createdAt!: Date;

  constructor(booking: Booking & { service?: Service }) {
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
