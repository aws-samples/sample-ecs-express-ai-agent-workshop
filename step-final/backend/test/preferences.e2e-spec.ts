import './setup';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { signUpUser, cleanDatabase } from './helpers';

describe('Preferences (e2e)', () => {
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

  // ── PATCH /users/me/preferences ──

  describe('PATCH /users/me/preferences', () => {
    it('should set theme preference and return updated user', async () => {
      const { accessToken } = await signUpUser(app);

      const res = await request(app.getHttpServer())
        .patch('/users/me/preferences')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ theme: 'dark' })
        .expect(200);

      expect(res.body.preferences).toEqual({ theme: 'dark' });
    });

    it('should update theme preference from dark to light', async () => {
      const { accessToken } = await signUpUser(app);

      await request(app.getHttpServer())
        .patch('/users/me/preferences')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ theme: 'dark' })
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch('/users/me/preferences')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ theme: 'light' })
        .expect(200);

      expect(res.body.preferences).toEqual({ theme: 'light' });
    });

    it('should set theme to system', async () => {
      const { accessToken } = await signUpUser(app);

      await request(app.getHttpServer())
        .patch('/users/me/preferences')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ theme: 'dark' })
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch('/users/me/preferences')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ theme: 'system' })
        .expect(200);

      expect(res.body.preferences).toEqual({ theme: 'system' });
    });

    it('should merge with existing preferences without overwriting', async () => {
      const { accessToken } = await signUpUser(app);

      await request(app.getHttpServer())
        .patch('/users/me/preferences')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ theme: 'dark' })
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch('/users/me/preferences')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ locale: 'ja' })
        .expect(200);

      expect(res.body.preferences).toEqual({ theme: 'dark', locale: 'ja' });
    });

    it('should return preferences via GET /auth/me after setting them', async () => {
      const { accessToken } = await signUpUser(app);

      await request(app.getHttpServer())
        .patch('/users/me/preferences')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ theme: 'dark' })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.preferences).toEqual({ theme: 'dark' });
    });

    it('should return null preferences for a new user via GET /auth/me', async () => {
      const { accessToken } = await signUpUser(app);

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.preferences).toBeNull();
    });

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .patch('/users/me/preferences')
        .send({ theme: 'dark' })
        .expect(401);
    });

    it('should return 401 for an invalid token', async () => {
      await request(app.getHttpServer())
        .patch('/users/me/preferences')
        .set('Authorization', 'Bearer invalid.token.here')
        .send({ theme: 'dark' })
        .expect(401);
    });
  });
});
