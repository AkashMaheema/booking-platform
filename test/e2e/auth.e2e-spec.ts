import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const dto = {
        email: 'e2e_register@example.com',
        password: 'Password123!',
        name: 'Test User',
      };
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(dto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe(dto.email.toLowerCase());
    });

    it('should reject duplicate email', async () => {
      const dto = {
        email: 'e2e_register@example.com',
        password: 'Password123!',
        name: 'Test User',
      };
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(dto)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('/api/v1/auth/login (POST)', () => {
    it('should login and return tokens', async () => {
      const dto = {
        email: 'e2e_register@example.com',
        password: 'Password123!',
      };
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(dto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should reject invalid password', async () => {
      const dto = {
        email: 'e2e_register@example.com',
        password: 'WrongPassword123!',
      };
      await request(app.getHttpServer()).post('/api/v1/auth/login').send(dto).expect(401);
    });
  });
});
