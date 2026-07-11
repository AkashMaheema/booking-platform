import { InvalidBookingDateException } from '../../../common/exceptions/invalid-booking-date.exception';

export class BookingDateValidator {
  /**
   * Validates if the given date string (YYYY-MM-DD) is in the past compared to the server's today.
   * Throws InvalidBookingDateException if it is in the past.
   */
  static validateFutureOrToday(dateString: string): Date {
    const bookingDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of today

    if (bookingDate < today) {
      throw new InvalidBookingDateException();
    }

    return bookingDate;
  }
}
