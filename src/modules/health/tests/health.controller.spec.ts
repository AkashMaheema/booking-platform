import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../health.controller';
import { PrismaService } from '../../../database/prisma.service';
import { TerminusModule, HealthCheckService } from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
      ],
    })
      .overrideProvider(HealthCheckService)
      .useValue({
        check: jest.fn().mockResolvedValue({
          status: 'ok',
          info: { database: { status: 'up' } },
          error: {},
          details: { database: { status: 'up' } },
        }),
      })
      .compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health check result', async () => {
    const result = await controller.check();
    expect(result).toEqual({
      status: 'ok',
      database: 'connected',
      timestamp: expect.any(String),
      uptime: expect.any(Number),
      environment: 'test',
      version: '1.0.0',
    });
  });
});
