import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InactiveServiceException } from '../../../common/exceptions/inactive-service.exception';
import { BookingAlreadyExistsException } from '../../../common/exceptions/booking-already-exists.exception';
import { InvalidBookingDateException } from '../../../common/exceptions/invalid-booking-date.exception';
import { InvalidStatusTransitionException } from '../../../common/exceptions/invalid-status-transition.exception';
import { CompletedBookingException } from '../../../common/exceptions/completed-booking.exception';
import { CancelledBookingException } from '../../../common/exceptions/cancelled-booking.exception';
import { BookingsService } from '../bookings.service';
import { BookingsRepository } from '../bookings.repository';
import { ServicesService } from '../../services/services.service';
import { BookingStatus } from '@prisma/client';
import { AuditService } from '../../../common/logging/audit.service';

describe('BookingsService', () => {
  let service: BookingsService;
  let repository: BookingsRepository;
  let servicesService: ServicesService;

  const mockServiceData = {
    id: 'service-1',
    title: 'Haircut',
    isActive: true,
  };

  const mockBooking: any = {
    id: 'booking-1',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+60123456789',
    serviceId: 'service-1',
    bookingDate: new Date('2100-01-01'), // Future date to avoid past date errors
    bookingTime: '14:00',
    status: BookingStatus.PENDING,
    notes: 'None',
    createdAt: new Date(),
    updatedAt: new Date(),

    service: mockServiceData as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: BookingsRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            updateStatus: jest.fn(),
            cancel: jest.fn(),
            findDuplicateBooking: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: ServicesService,
          useValue: {
            getService: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    repository = module.get<BookingsRepository>(BookingsRepository);
    servicesService = module.get<ServicesService>(ServicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    const dto = {
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+60123456789',
      serviceId: 'service-1',
      bookingDate: '2100-01-01',
      bookingTime: '14:00',
    };

    it('should throw NotFoundException if service does not exist', async () => {
      jest.spyOn(servicesService, 'getService').mockRejectedValue(new NotFoundException());
      await expect(service.createBooking(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw InactiveServiceException if service is inactive', async () => {
      jest
        .spyOn(servicesService, 'getService')
        .mockResolvedValue({ ...mockServiceData, isActive: false } as any);
      await expect(service.createBooking(dto)).rejects.toThrow(InactiveServiceException);
    });

    it('should throw InvalidBookingDateException if booking date is in the past', async () => {
      jest.spyOn(servicesService, 'getService').mockResolvedValue(mockServiceData as any);
      await expect(service.createBooking({ ...dto, bookingDate: '2000-01-01' })).rejects.toThrow(
        InvalidBookingDateException,
      );
    });

    it('should throw BookingAlreadyExistsException if duplicate booking exists', async () => {
      jest.spyOn(servicesService, 'getService').mockResolvedValue(mockServiceData as any);
      jest.spyOn(repository, 'findDuplicateBooking').mockResolvedValue(mockBooking);

      await expect(service.createBooking(dto)).rejects.toThrow(BookingAlreadyExistsException);
    });

    it('should create and return booking on success', async () => {
      jest.spyOn(servicesService, 'getService').mockResolvedValue(mockServiceData as any);
      jest.spyOn(repository, 'findDuplicateBooking').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockResolvedValue(mockBooking);

      const result = await service.createBooking(dto);
      expect(result.id).toBe('booking-1');
      expect(repository.create).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should throw NotFoundException if booking not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);
      await expect(service.updateStatus('1', { status: BookingStatus.CONFIRMED })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw CompletedBookingException if booking is already COMPLETED', async () => {
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue({ ...mockBooking, status: BookingStatus.COMPLETED });
      await expect(service.updateStatus('1', { status: BookingStatus.PENDING })).rejects.toThrow(
        CompletedBookingException,
      );
    });

    it('should throw CancelledBookingException if trying to complete a CANCELLED booking', async () => {
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue({ ...mockBooking, status: BookingStatus.CANCELLED });
      await expect(service.updateStatus('1', { status: BookingStatus.COMPLETED })).rejects.toThrow(
        CancelledBookingException,
      );
    });

    it('should throw InvalidStatusTransitionException for invalid arbitrary transitions', async () => {
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue({ ...mockBooking, status: BookingStatus.PENDING });
      // PENDING -> COMPLETED is invalid
      await expect(service.updateStatus('1', { status: BookingStatus.COMPLETED })).rejects.toThrow(
        InvalidStatusTransitionException,
      );
    });

    it('should update status on valid transition', async () => {
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue({ ...mockBooking, status: BookingStatus.PENDING });
      jest
        .spyOn(repository, 'updateStatus')
        .mockResolvedValue({ ...mockBooking, status: BookingStatus.CONFIRMED });

      const result = await service.updateStatus('1', { status: BookingStatus.CONFIRMED });
      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });
  });

  describe('cancelBooking', () => {
    it('should throw CompletedBookingException if booking is COMPLETED', async () => {
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue({ ...mockBooking, status: BookingStatus.COMPLETED });
      await expect(service.cancelBooking('1')).rejects.toThrow(CompletedBookingException);
    });

    it('should return already CANCELLED booking without updating', async () => {
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue({ ...mockBooking, status: BookingStatus.CANCELLED });
      const result = await service.cancelBooking('1');
      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(repository.cancel).not.toHaveBeenCalled();
    });

    it('should cancel booking successfully', async () => {
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue({ ...mockBooking, status: BookingStatus.PENDING });
      jest
        .spyOn(repository, 'cancel')
        .mockResolvedValue({ ...mockBooking, status: BookingStatus.CANCELLED });

      const result = await service.cancelBooking('1');
      expect(result.status).toBe(BookingStatus.CANCELLED);
    });
  });

  describe('getBookings — pagination, search & filter', () => {
    it('should return paginated list with meta', async () => {
      jest.spyOn(repository, 'findAll').mockResolvedValue({ data: [mockBooking], total: 1 });

      const result = await service.getBookings({ page: 1, limit: 10 });
      expect(result.data.length).toBe(1);
      expect(result.meta.totalItems).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should return empty data with zero meta when no results', async () => {
      jest.spyOn(repository, 'findAll').mockResolvedValue({ data: [], total: 0 });

      const result = await service.getBookings({ page: 1, limit: 10 });
      expect(result.data).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.hasNextPage).toBe(false);
    });

    it('should return correct hasNextPage for multi-page results', async () => {
      jest.spyOn(repository, 'findAll').mockResolvedValue({ data: [mockBooking], total: 30 });

      const result = await service.getBookings({ page: 1, limit: 10 });
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should pass search filter through to repository', async () => {
      const findAllSpy = jest
        .spyOn(repository, 'findAll')
        .mockResolvedValue({ data: [], total: 0 });

      await service.getBookings({ page: 1, limit: 10, search: 'john' });
      expect(findAllSpy).toHaveBeenCalledWith(expect.objectContaining({ search: 'john' }));
    });

    it('should pass status filter through to repository', async () => {
      const findAllSpy = jest
        .spyOn(repository, 'findAll')
        .mockResolvedValue({ data: [], total: 0 });

      await service.getBookings({ page: 1, limit: 10, status: BookingStatus.CONFIRMED });
      expect(findAllSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: BookingStatus.CONFIRMED }),
      );
    });

    it('should pass bookingDate filter through to repository', async () => {
      const findAllSpy = jest
        .spyOn(repository, 'findAll')
        .mockResolvedValue({ data: [], total: 0 });

      await service.getBookings({ page: 1, limit: 10, bookingDate: '2026-08-01' });
      expect(findAllSpy).toHaveBeenCalledWith(
        expect.objectContaining({ bookingDate: '2026-08-01' }),
      );
    });

    it('should pass combined filters through to repository', async () => {
      const findAllSpy = jest
        .spyOn(repository, 'findAll')
        .mockResolvedValue({ data: [], total: 0 });

      await service.getBookings({
        page: 2,
        limit: 20,
        search: 'alex',
        status: BookingStatus.PENDING,
        bookingDate: '2026-08-01',
        sortBy: 'bookingTime',
        order: 'asc',
      });
      expect(findAllSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'alex',
          status: BookingStatus.PENDING,
          bookingDate: '2026-08-01',
          sortBy: 'bookingTime',
          order: 'asc',
        }),
      );
    });
  });
});
