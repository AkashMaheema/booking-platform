import { BookingStatus } from '@prisma/client';
import { InvalidStatusTransitionException } from '../../../common/exceptions/invalid-status-transition.exception';
import { CompletedBookingException } from '../../../common/exceptions/completed-booking.exception';
import { CancelledBookingException } from '../../../common/exceptions/cancelled-booking.exception';

export class BookingStatusValidator {
  private static readonly validTransitions: Record<BookingStatus, BookingStatus[]> = {
    [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    [BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
    [BookingStatus.CANCELLED]: [],
    [BookingStatus.COMPLETED]: [],
  };

  /**
   * Validates if the transition from currentStatus to newStatus is allowed.
   * Throws domain-specific exceptions if the transition is invalid.
   */
  static validate(currentStatus: BookingStatus, newStatus: BookingStatus): void {
    if (currentStatus === BookingStatus.COMPLETED) {
      throw new CompletedBookingException();
    }

    if (currentStatus === BookingStatus.CANCELLED && newStatus === BookingStatus.COMPLETED) {
      throw new CancelledBookingException();
    }

    if (currentStatus !== newStatus && !this.validTransitions[currentStatus].includes(newStatus)) {
      throw new InvalidStatusTransitionException(
        `Cannot transition booking from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
