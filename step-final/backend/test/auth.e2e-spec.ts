import './setup';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { uniqueEmail, signUpUser, cleanDatabase } from './helpers';

describe('Auth (e2e)', () => {
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

  // ── POST /auth/signup ──

  describe('POST /auth/signup', () => {
    it('should register a new user and return verification message', async () => {
      const email = uniqueEmail('signup');
      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email, password: 'password123', name: 'Test User' })
        .expect(201);

      expect(res.body.message).toBe('Verification email sent');

      // User should exist with emailVerified = false
      const user = await prisma.user.findUnique({ where: { email } });
      expect(user).not.toBeNull();
      expect(user!.emailVerified).toBe(false);
      expect(user!.emailVerificationToken).not.toBeNull();
    });

    it('should return 409 for duplicate email', async () => {
      const email = uniqueEmail('dup');
      await signUpUser(app, { email });

      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email, password: 'password123' })
        .expect(409);

      expect(res.body.message).toContain('Email already in use');
    });

    it('should return 400 for missing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ password: 'password123' })
        .expect(400);
    });

    it('should return 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: 'not-an-email', password: 'password123' })
        .expect(400);
    });

    it('should return 400 for password shorter than 8 characters', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: uniqueEmail(), password: 'short' })
        .expect(400);
    });
  });

  // ── POST /auth/verify-email ──

  describe('POST /auth/verify-email', () => {
    it('should verify email with a valid token', async () => {
      const email = uniqueEmail('verify');
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email, password: 'password123' })
        .expect(201);

      const user = await prisma.user.findUnique({ where: { email } });
      const token = user!.emailVerificationToken!;

      const res = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token })
        .expect(200);

      expect(res.body.message).toBe('Email verified successfully');

      // User should now be verified
      const updated = await prisma.user.findUnique({ where: { email } });
      expect(updated!.emailVerified).toBe(true);
      expect(updated!.emailVerificationToken).toBeNull();
    });

    it('should return 400 for an invalid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);
    });

    it('should return 400 for an expired token', async () => {
      const email = uniqueEmail('expired');
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email, password: 'password123' })
        .expect(201);

      // Manually expire the token
      await prisma.user.update({
        where: { email },
        data: { emailVerificationExpires: new Date(Date.now() - 1000) },
      });

      const user = await prisma.user.findUnique({ where: { email } });

      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token: user!.emailVerificationToken })
        .expect(400);
    });
  });

  // ── POST /auth/resend-verification ──

  describe('POST /auth/resend-verification', () => {
    it('should return success for an unverified user', async () => {
      const email = uniqueEmail('resend');
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email, password: 'password123' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/auth/resend-verification')
        .send({ email })
        .expect(200);

      expect(res.body.message).toBeDefined();
    });

    it('should return success even for non-existent email (prevents enumeration)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/resend-verification')
        .send({ email: 'nonexistent@test.example' })
        .expect(200);

      expect(res.body.message).toBeDefined();
    });
  });

  // ── POST /auth/signin ──

  describe('POST /auth/signin', () => {
    let testEmail: string;
    const testPassword = 'password123';

    beforeAll(async () => {
      testEmail = uniqueEmail('signin');
      await signUpUser(app, { email: testEmail, password: testPassword });
    });

    it('should sign in successfully and return tokens + user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: testEmail, password: testPassword })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 401 for unverified email', async () => {
      const email = uniqueEmail('unverified');
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email, password: testPassword })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email, password: testPassword })
        .expect(401);

      expect(res.body.message).toContain('Email not verified');
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: testEmail, password: 'wrongpassword' })
        .expect(401);

      expect(res.body.message).toContain('Invalid credentials');
    });

    it('should return 401 for non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: 'nobody@test.example', password: 'password123' })
        .expect(401);
    });

    it('should return 400 for missing fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/signin')
        .send({})
        .expect(400);
    });
  });

  // ── POST /auth/refresh ──

  describe('POST /auth/refresh', () => {
    it('should return new tokens for a valid refresh token', async () => {
      const { refreshToken } = await signUpUser(app);

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for an invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' })
        .expect(401);
    });

    it('should return 400 for missing refreshToken field', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  // ── PATCH /auth/email ──

  describe('PATCH /auth/email', () => {
    it('should update email and reset verification', async () => {
      const { accessToken, email: oldEmail } = await signUpUser(app);
      const newEmail = uniqueEmail('newemail');

      const res = await request(app.getHttpServer())
        .patch('/auth/email')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: newEmail })
        .expect(200);

      expect(res.body.email).toBe(newEmail);
      expect(res.body.emailVerified).toBe(false);

      // Database should reflect the change
      const user = await prisma.user.findUnique({ where: { email: newEmail } });
      expect(user).not.toBeNull();
      expect(user!.emailVerified).toBe(false);
      expect(user!.emailVerificationToken).not.toBeNull();

      // Old email should no longer exist
      const oldUser = await prisma.user.findUnique({ where: { email: oldEmail } });
      expect(oldUser).toBeNull();
    });

    it('should return 409 when email is already in use by another user', async () => {
      const { accessToken } = await signUpUser(app);
      const { email: existingEmail } = await signUpUser(app);

      const res = await request(app.getHttpServer())
        .patch('/auth/email')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: existingEmail })
        .expect(409);

      expect(res.body.message).toContain('Email already in use');
    });

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .patch('/auth/email')
        .send({ email: 'new@test.example' })
        .expect(401);
    });

    it('should return 400 for invalid email format', async () => {
      const { accessToken } = await signUpUser(app);

      await request(app.getHttpServer())
        .patch('/auth/email')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'not-an-email' })
        .expect(400);
    });
  });

  // ── GET /auth/me ──

  describe('GET /auth/me', () => {
    it('should return the user profile for a valid access token', async () => {
      const { accessToken, email } = await signUpUser(app, {
        name: 'Me User',
      });

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.email).toBe(email);
      expect(res.body.name).toBe('Me User');
      expect(res.body.hasPassword).toBe(true);
      expect(res.body.emailVerified).toBe(true);
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('emailVerificationToken');
      expect(res.body).not.toHaveProperty('emailVerificationExpires');
      expect(res.body.appleId).toBeNull();
      expect(res.body.githubId).toBeNull();
      expect(res.body.googleId).toBeNull();
      expect(res.body.twitterId).toBeNull();
    });

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('should return 401 for an invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });
});
