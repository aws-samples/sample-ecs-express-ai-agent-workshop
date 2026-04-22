import './setup';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { signUpUser, cleanDatabase } from './helpers';

describe('Items (e2e)', () => {
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

  // ── POST /items ──

  describe('POST /items', () => {
    it('should create an item for the authenticated user', async () => {
      const { accessToken } = await signUpUser(app);

      const res = await request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Test Item' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Test Item');
      expect(res.body).toHaveProperty('userId');
      expect(res.body).toHaveProperty('createdAt');
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/items')
        .send({ name: 'Test Item' })
        .expect(401);
    });

    it('should return 400 for empty name', async () => {
      const { accessToken } = await signUpUser(app);

      await request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '' })
        .expect(400);
    });

    it('should return 400 for missing name', async () => {
      const { accessToken } = await signUpUser(app);

      await request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);
    });
  });

  // ── GET /items ──

  describe('GET /items', () => {
    it('should return empty list for new user', async () => {
      const { accessToken } = await signUpUser(app);

      const res = await request(app.getHttpServer())
        .get('/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('should return only items owned by the authenticated user', async () => {
      const userA = await signUpUser(app);
      const userB = await signUpUser(app);

      await request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ name: 'UserA Item 1' });

      await request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ name: 'UserA Item 2' });

      await request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .send({ name: 'UserB Item' });

      const resA = await request(app.getHttpServer())
        .get('/items')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .expect(200);

      expect(resA.body).toHaveLength(2);
      expect(resA.body.map((i: any) => i.name)).toContain('UserA Item 1');
      expect(resA.body.map((i: any) => i.name)).toContain('UserA Item 2');
      expect(resA.body.map((i: any) => i.name)).not.toContain('UserB Item');

      const resB = await request(app.getHttpServer())
        .get('/items')
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .expect(200);

      expect(resB.body).toHaveLength(1);
      expect(resB.body[0].name).toBe('UserB Item');
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer()).get('/items').expect(401);
    });
  });

  // ── DELETE /items/:id ──

  describe('DELETE /items/:id', () => {
    it('should delete an item owned by the authenticated user (204)', async () => {
      const { accessToken } = await signUpUser(app);

      const createRes = await request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'To Delete' })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/items/${createRes.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      const listRes = await request(app.getHttpServer())
        .get('/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(listRes.body).toHaveLength(0);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .delete('/items/some-id')
        .expect(401);
    });

    it('should return 404 for non-existent item', async () => {
      const { accessToken } = await signUpUser(app);

      await request(app.getHttpServer())
        .delete('/items/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it("should return 403 when deleting another user's item", async () => {
      const userA = await signUpUser(app);
      const userB = await signUpUser(app);

      const createRes = await request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ name: 'UserA Private Item' })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/items/${createRes.body.id}`)
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .expect(403);
    });
  });
});
