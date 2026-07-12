import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from '../bookings.controller';
import { BookingsService } from '../bookings.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingStatusDto } from '../dto/update-booking-status.dto';
import { BookingQueryDto } from '../dto/booking-query.dto';
import { BookingStatus } from '@prisma/client';

describe('BookingsController', () => {
  let controller: BookingsController;
  let bookingsService: BookingsService;

  const mockBookingsService = {
    createBooking: jest.fn(),
    getBookings: jest.fn(),
    getBooking: jest.fn(),
    updateStatus: jest.fn(),
    cancelBooking: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    bookingsService = module.get<BookingsService>(BookingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createBooking', () => {
    it('should create a new booking', async () => {
      const dto: CreateBookingDto = {
        serviceId: 'service-uuid',
        bookingDate: '2026-08-20',
        bookingTime: '14:00',
        customerName: 'Test',
        customerEmail: 'test@example.com',
        customerPhone: '+1234567890',
      };
      const result = { id: 'uuid', ...dto, status: BookingStatus.PENDING };
      mockBookingsService.createBooking.mockResolvedValue(result);

      const res = await controller.createBooking(dto);
      expect(bookingsService.createBooking).toHaveBeenCalledWith(dto);
      expect(res).toEqual({
        success: true,
        message: 'Booking created successfully.',
        data: result,
      });
    });
  });

  describe('getBookings', () => {
    it('should return a paginated list of bookings', async () => {
      const query: BookingQueryDto = { page: 1, limit: 10 };
      const result = { data: [], meta: { page: 1, limit: 10, total: 0 } };
      mockBookingsService.getBookings.mockResolvedValue(result);

      const res = await controller.getBookings(query);
      expect(bookingsService.getBookings).toHaveBeenCalledWith(query);
      expect(res).toEqual({
        success: true,
        data: [],
        meta: result.meta,
      });
    });
  });

  describe('getBooking', () => {
    it('should return a single booking', async () => {
      const result = { id: 'uuid', customerName: 'Test' };
      mockBookingsService.getBooking.mockResolvedValue(result);

      const res = await controller.getBooking('uuid');
      expect(bookingsService.getBooking).toHaveBeenCalledWith('uuid');
      expect(res).toEqual({
        success: true,
        data: result,
      });
    });
  });

  describe('updateStatus', () => {
    it('should update booking status', async () => {
      const dto: UpdateBookingStatusDto = { status: BookingStatus.CONFIRMED };
      const result = { id: 'uuid', status: BookingStatus.CONFIRMED };
      mockBookingsService.updateStatus.mockResolvedValue(result);

      const res = await controller.updateStatus('uuid', dto);
      expect(bookingsService.updateStatus).toHaveBeenCalledWith('uuid', dto);
      expect(res).toEqual({
        success: true,
        data: result,
      });
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking', async () => {
      const result = { id: 'uuid', status: BookingStatus.CANCELLED };
      mockBookingsService.cancelBooking.mockResolvedValue(result);

      const res = await controller.cancelBooking('uuid');
      expect(bookingsService.cancelBooking).toHaveBeenCalledWith('uuid');
      expect(res).toEqual({
        success: true,
        data: result,
      });
    });
  });
});
