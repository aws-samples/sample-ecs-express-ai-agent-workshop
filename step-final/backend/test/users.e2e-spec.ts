import './setup';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { uniqueEmail, cleanDatabase } from './helpers';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(
      session({ secret: 'test', resave: false, saveUninitialized: false }),
    );
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  // ── POST /users ──

  describe('POST /users', () => {
    it('should create a user', async () => {
      const email = uniqueEmail('user');
      const res = await request(app.getHttpServer())
        .post('/users')
        .send({ email, name: 'New User' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe(email);
      expect(res.body.name).toBe('New User');
    });

    it('should return 400 for invalid email', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({ email: 'bad-email', name: 'Fail User' })
        .expect(400);
    });

    it('should return 400 for missing email', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'No Email' })
        .expect(400);
    });
  });

  // ── GET /users ──

  describe('GET /users', () => {
    it('should return a list of users', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── GET /users/:id ──

  describe('GET /users/:id', () => {
    it('should return a user by id', async () => {
      const email = uniqueEmail('findone');
      const createRes = await request(app.getHttpServer())
        .post('/users')
        .send({ email, name: 'FindMe' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/users/${createRes.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(createRes.body.id);
      expect(res.body.email).toBe(email);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/users/non-existent-cuid')
        .expect(404);
    });
  });

  // ── PATCH /users/:id ──

  describe('PATCH /users/:id', () => {
    it('should update a user', async () => {
      const email = uniqueEmail('patch');
      const createRes = await request(app.getHttpServer())
        .post('/users')
        .send({ email, name: 'Original' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/users/${createRes.body.id}`)
        .send({ name: 'Updated' })
        .expect(200);

      expect(res.body.name).toBe('Updated');
      expect(res.body.email).toBe(email);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .patch('/users/non-existent-cuid')
        .send({ name: 'Ghost' })
        .expect(404);
    });
  });

  // ── DELETE /users/:id ──

  describe('DELETE /users/:id', () => {
    it('should delete a user (204)', async () => {
      const email = uniqueEmail('delete');
      const createRes = await request(app.getHttpServer())
        .post('/users')
        .send({ email })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/users/${createRes.body.id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/users/${createRes.body.id}`)
        .expect(404);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .delete('/users/non-existent-cuid')
        .expect(404);
    });
  });
});
