import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('BookingsController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let serviceId: string;
  let bookingId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const prisma = app.get(PrismaService);
    await prisma.user.create({
      data: {
        email: 'admin_bookings@example.com',
        password: 'Password123!',
        name: 'Admin User',
        role: 'ADMIN',
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin_bookings@example.com', password: 'Password123!' });

    adminToken = loginRes.body.data.accessToken;

    const srvRes = await request(app.getHttpServer())
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Booking E2E Service',
        description: 'Test',
        price: 100,
        duration: 30,
      });

    serviceId = srvRes.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/bookings (POST)', () => {
    it('should create a booking', async () => {
      // Date in future
      const date = new Date();
      date.setDate(date.getDate() + 1);

      const dto = {
        serviceId,
        bookingDate: date.toISOString().split('T')[0],
        bookingTime: '10:00',
        customerName: 'E2E Customer',
        customerEmail: 'customer@example.com',
        customerPhone: '+1987654321',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .send(dto)
        .expect(201);

      expect(response.body.success).toBe(true);
      bookingId = response.body.data.id;
    });

    it('should reject past date', async () => {
      const date = new Date();
      date.setDate(date.getDate() - 1); // Past date

      await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .send({
          serviceId,
          bookingDate: date.toISOString().split('T')[0],
          bookingTime: '10:00',
          customerName: 'E2E Customer',
          customerEmail: 'customer@example.com',
          customerPhone: '+1987654321',
        })
        .expect(400);
    });
  });

  describe('/api/v1/bookings/:id/status (PATCH)', () => {
    it('should update booking status (ADMIN)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);

      expect(response.body.data.status).toBe('CONFIRMED');
    });

    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${bookingId}/status`)
        .send({ status: 'CANCELLED' })
        .expect(401);
    });
  });
});
