import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('ServicesController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let serviceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Create an admin user for these tests
    const prisma = app.get(PrismaService);
    await prisma.user.create({
      data: {
        email: 'admin_services@example.com',
        password: 'Password123!',
        name: 'Admin User',
        role: 'ADMIN',
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin_services@example.com', password: 'Password123!' });

    adminToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/services (POST)', () => {
    it('should create a service as admin', async () => {
      const dto = {
        title: 'E2E Test Service',
        description: 'Test Description',
        price: 150.0,
        duration: 90,
      };
      const response = await request(app.getHttpServer())
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      serviceId = response.body.data.id;
    });

    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer()).post('/api/v1/services').send({ title: 'A' }).expect(401);
    });
  });

  describe('/api/v1/services (GET)', () => {
    it('should return a paginated list of services', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/services?limit=10&page=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('/api/v1/services/:id (PATCH)', () => {
    it('should update a service as admin', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/services/${serviceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 200 })
        .expect(200);

      expect(response.body.data.price).toBe(200);
    });
  });
});
