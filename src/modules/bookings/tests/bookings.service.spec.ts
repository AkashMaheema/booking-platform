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

describe('BookingsService', () => {
  let service: BookingsService;
  let repository: BookingsRepository;
  let servicesService: ServicesService;

  const mockServiceData = {
    id: 'service-1',
    title: 'Haircut',
    isActive: true,
  };

  const mockBooking = {
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
    service: mockServiceData,
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
      jest.spyOn(servicesService, 'getService').mockResolvedValue({ ...mockServiceData, isActive: false } as any);
      await expect(service.createBooking(dto)).rejects.toThrow(InactiveServiceException);
    });

    it('should throw InvalidBookingDateException if booking date is in the past', async () => {
      jest.spyOn(servicesService, 'getService').mockResolvedValue(mockServiceData as any);
      await expect(service.createBooking({ ...dto, bookingDate: '2000-01-01' })).rejects.toThrow(InvalidBookingDateException);
    });

    it('should throw BookingAlreadyExistsException if duplicate booking exists', async () => {
      jest.spyOn(servicesService, 'getService').mockResolvedValue(mockServiceData as any);
      jest.spyOn(repository, 'findDuplicateBooking').mockResolvedValue(mockBooking as any);
      
      await expect(service.createBooking(dto)).rejects.toThrow(BookingAlreadyExistsException);
    });

    it('should create and return booking on success', async () => {
      jest.spyOn(servicesService, 'getService').mockResolvedValue(mockServiceData as any);
      jest.spyOn(repository, 'findDuplicateBooking').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockResolvedValue(mockBooking as any);

      const result = await service.createBooking(dto);
      expect(result.id).toBe('booking-1');
      expect(repository.create).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should throw NotFoundException if booking not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);
      await expect(service.updateStatus('1', { status: BookingStatus.CONFIRMED })).rejects.toThrow(NotFoundException);
    });

    it('should throw CompletedBookingException if booking is already COMPLETED', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue({ ...mockBooking, status: BookingStatus.COMPLETED } as any);
      await expect(service.updateStatus('1', { status: BookingStatus.PENDING })).rejects.toThrow(CompletedBookingException);
    });

    it('should throw CancelledBookingException if trying to complete a CANCELLED booking', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue({ ...mockBooking, status: BookingStatus.CANCELLED } as any);
      await expect(service.updateStatus('1', { status: BookingStatus.COMPLETED })).rejects.toThrow(CancelledBookingException);
    });

    it('should throw InvalidStatusTransitionException for invalid arbitrary transitions', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue({ ...mockBooking, status: BookingStatus.PENDING } as any);
      // PENDING -> COMPLETED is invalid
      await expect(service.updateStatus('1', { status: BookingStatus.COMPLETED })).rejects.toThrow(InvalidStatusTransitionException);
    });

    it('should update status on valid transition', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue({ ...mockBooking, status: BookingStatus.PENDING } as any);
      jest.spyOn(repository, 'updateStatus').mockResolvedValue({ ...mockBooking, status: BookingStatus.CONFIRMED } as any);

      const result = await service.updateStatus('1', { status: BookingStatus.CONFIRMED });
      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });
  });

  describe('cancelBooking', () => {
    it('should throw CompletedBookingException if booking is COMPLETED', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue({ ...mockBooking, status: BookingStatus.COMPLETED } as any);
      await expect(service.cancelBooking('1')).rejects.toThrow(CompletedBookingException);
    });

    it('should return already CANCELLED booking without updating', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue({ ...mockBooking, status: BookingStatus.CANCELLED } as any);
      const result = await service.cancelBooking('1');
      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(repository.cancel).not.toHaveBeenCalled();
    });

    it('should cancel booking successfully', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue({ ...mockBooking, status: BookingStatus.PENDING } as any);
      jest.spyOn(repository, 'cancel').mockResolvedValue({ ...mockBooking, status: BookingStatus.CANCELLED } as any);

      const result = await service.cancelBooking('1');
      expect(result.status).toBe(BookingStatus.CANCELLED);
    });
  });
});
