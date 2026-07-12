import { Test, TestingModule } from '@nestjs/testing';
import { BookingsRepository } from '../bookings.repository';
import { PrismaService } from '../../../database/prisma.service';

describe('BookingsRepository', () => {
  let repository: BookingsRepository;
  let prisma: PrismaService;

  const mockPrismaService: any = {
    booking: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((args) => {
      if (typeof args === 'function') {
        return args(mockPrismaService);
      }
      return Promise.all(args);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<BookingsRepository>(BookingsRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a booking', async () => {
      const data: any = { serviceId: 's', date: new Date(), customerEmail: 'c@c.com' };
      await repository.create(data);
      expect(prisma.booking.create).toHaveBeenCalledWith({
        data,
        include: { service: { select: { id: true, title: true, duration: true, price: true } } },
      });
    });
  });

  describe('findAll', () => {
    it('should find all bookings with count', async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([]);
      mockPrismaService.booking.count.mockResolvedValue(0);

      const res = await repository.findAll({
        skip: 0,
        take: 10,
        search: '',
        order: 'asc',
        status: undefined,
      } as any);
      expect(prisma.booking.findMany).toHaveBeenCalled();
      expect(prisma.booking.count).toHaveBeenCalled();
      expect(res).toEqual({ data: [], total: 0 });
    });
  });

  describe('findById', () => {
    it('should find booking by id', async () => {
      await repository.findById('uuid');
      expect(prisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid' },
        include: { service: { select: { id: true, title: true, duration: true, price: true } } },
      });
    });
  });

  describe('updateStatus', () => {
    it('should update booking status', async () => {
      await repository.updateStatus('uuid', 'CONFIRMED');
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'uuid' },
        data: { status: 'CONFIRMED' },
        include: { service: { select: { id: true, title: true, duration: true, price: true } } },
      });
    });
  });

  describe('findDuplicateBooking', () => {
    it('should check for conflicting bookings', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue(null);
      const res = await repository.findDuplicateBooking('serviceId', new Date(), '10:00');
      expect(res).toBeNull();
    });

    it('should return booking if conflict exists', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue({});
      const res = await repository.findDuplicateBooking('serviceId', new Date(), '10:00');
      expect(res).toBeDefined();
    });
  });
});
