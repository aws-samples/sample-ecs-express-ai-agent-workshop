import './setup';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import request from 'supertest';
import * as OTPAuth from 'otpauth';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { signUpUser, cleanDatabase } from './helpers';

function generateTotpCode(secret: string): string {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });
  return totp.generate();
}

describe('TOTP MFA (e2e)', () => {
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

  // ── POST /auth/totp/setup ──

  describe('POST /auth/totp/setup', () => {
    it('should return secret and URI for authenticated user', async () => {
      const { accessToken } = await signUpUser(app);

      const res = await request(app.getHttpServer())
        .post('/auth/totp/setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('secret');
      expect(res.body).toHaveProperty('uri');
      expect(res.body.uri).toContain('otpauth://totp/');
      expect(res.body.secret).toHaveLength(32); // base32 of 20 bytes
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/auth/totp/setup')
        .expect(401);
    });

    it('should return 409 if TOTP is already enabled', async () => {
      const { accessToken } = await signUpUser(app);

      // Setup + enable
      const setup = await request(app.getHttpServer())
        .post('/auth/totp/setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const code = generateTotpCode(setup.body.secret);
      await request(app.getHttpServer())
        .post('/auth/totp/enable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code })
        .expect(200);

      // Try setup again
      await request(app.getHttpServer())
        .post('/auth/totp/setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(409);
    });
  });

  // ── POST /auth/totp/enable ──

  describe('POST /auth/totp/enable', () => {
    it('should enable TOTP and return 8 recovery codes', async () => {
      const { accessToken } = await signUpUser(app);

      const setup = await request(app.getHttpServer())
        .post('/auth/totp/setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const code = generateTotpCode(setup.body.secret);
      const res = await request(app.getHttpServer())
        .post('/auth/totp/enable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code })
        .expect(200);

      expect(res.body.recoveryCodes).toHaveLength(8);
      expect(res.body.recoveryCodes[0]).toHaveLength(8); // hex string

      // Verify in database
      const me = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(me.body.totpEnabled).toBe(true);
      expect(me.body).not.toHaveProperty('totpSecret');
      expect(me.body).not.toHaveProperty('recoveryCodes');
    });

    it('should return 400 for invalid TOTP code', async () => {
      const { accessToken } = await signUpUser(app);

      await request(app.getHttpServer())
        .post('/auth/totp/setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/totp/enable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: '000000' })
        .expect(400);
    });

    it('should return 400 if setup was not called', async () => {
      const { accessToken } = await signUpUser(app);

      await request(app.getHttpServer())
        .post('/auth/totp/enable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: '123456' })
        .expect(400);
    });
  });

  // ── POST /auth/signin with TOTP ──

  describe('POST /auth/signin (TOTP enabled)', () => {
    let email: string;
    let password: string;
    let totpSecret: string;

    beforeAll(async () => {
      const user = await signUpUser(app);
      email = user.email;
      password = user.password;

      const setup = await request(app.getHttpServer())
        .post('/auth/totp/setup')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      totpSecret = setup.body.secret;

      const code = generateTotpCode(totpSecret);
      await request(app.getHttpServer())
        .post('/auth/totp/enable')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ code })
        .expect(200);
    });

    it('should return requiresMfa instead of tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email, password })
        .expect(201);

      expect(res.body.requiresMfa).toBe(true);
      expect(res.body).toHaveProperty('mfaToken');
      expect(res.body).not.toHaveProperty('accessToken');
    });
  });

  // ── POST /auth/totp/verify ──

  describe('POST /auth/totp/verify', () => {
    let email: string;
    let password: string;
    let totpSecret: string;

    beforeAll(async () => {
      const user = await signUpUser(app);
      email = user.email;
      password = user.password;

      const setup = await request(app.getHttpServer())
        .post('/auth/totp/setup')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      totpSecret = setup.body.secret;

      const code = generateTotpCode(totpSecret);
      await request(app.getHttpServer())
        .post('/auth/totp/enable')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ code })
        .expect(200);
    });

    it('should return tokens for valid TOTP code', async () => {
      const signin = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email, password })
        .expect(201);

      const code = generateTotpCode(totpSecret);
      const res = await request(app.getHttpServer())
        .post('/auth/totp/verify')
        .send({ mfaToken: signin.body.mfaToken, code })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe(email);
    });

    it('should return 401 for invalid TOTP code', async () => {
      const signin = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email, password })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/totp/verify')
        .send({ mfaToken: signin.body.mfaToken, code: '000000' })
        .expect(401);
    });

    it('should return 401 for invalid MFA token', async () => {
      await request(app.getHttpServer())
        .post('/auth/totp/verify')
        .send({ mfaToken: 'invalid.token.here', code: '123456' })
        .expect(401);
    });
  });

  // ── Recovery codes ──

  describe('Recovery codes', () => {
    let email: string;
    let password: string;
    let totpSecret: string;
    let recoveryCodes: string[];

    beforeAll(async () => {
      const user = await signUpUser(app);
      email = user.email;
      password = user.password;

      const setup = await request(app.getHttpServer())
        .post('/auth/totp/setup')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      totpSecret = setup.body.secret;

      const code = generateTotpCode(totpSecret);
      const enable = await request(app.getHttpServer())
        .post('/auth/totp/enable')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ code })
        .expect(200);

      recoveryCodes = enable.body.recoveryCodes;
    });

    it('should allow sign-in with a recovery code', async () => {
      const signin = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email, password })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/auth/totp/verify')
        .send({ mfaToken: signin.body.mfaToken, code: recoveryCodes[0] })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
    });

    it('should not allow reuse of the same recovery code', async () => {
      const signin = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email, password })
        .expect(201);

      // The first recovery code was already used above
      await request(app.getHttpServer())
        .post('/auth/totp/verify')
        .send({ mfaToken: signin.body.mfaToken, code: recoveryCodes[0] })
        .expect(401);
    });
  });

  // ── POST /auth/totp/disable ──

  describe('POST /auth/totp/disable', () => {
    it('should disable TOTP and allow normal sign-in', async () => {
      const user = await signUpUser(app);

      const setup = await request(app.getHttpServer())
        .post('/auth/totp/setup')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      const code = generateTotpCode(setup.body.secret);
      await request(app.getHttpServer())
        .post('/auth/totp/enable')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ code })
        .expect(200);

      // Disable with a valid TOTP code
      const disableCode = generateTotpCode(setup.body.secret);
      await request(app.getHttpServer())
        .post('/auth/totp/disable')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ code: disableCode })
        .expect(200);

      // Sign-in should now return tokens directly
      const signin = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: user.email, password: user.password })
        .expect(201);

      expect(signin.body).toHaveProperty('accessToken');
      expect(signin.body).not.toHaveProperty('requiresMfa');
    });

    it('should return 400 for invalid TOTP code', async () => {
      const user = await signUpUser(app);

      const setup = await request(app.getHttpServer())
        .post('/auth/totp/setup')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      const code = generateTotpCode(setup.body.secret);
      await request(app.getHttpServer())
        .post('/auth/totp/enable')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ code })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/totp/disable')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ code: '000000' })
        .expect(400);
    });

    it('should return 400 if TOTP is not enabled', async () => {
      const { accessToken } = await signUpUser(app);

      await request(app.getHttpServer())
        .post('/auth/totp/disable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: '123456' })
        .expect(400);
    });
  });

  // ── POST /auth/totp/recovery-codes ──

  describe('POST /auth/totp/recovery-codes', () => {
    it('should regenerate recovery codes with valid TOTP code', async () => {
      const user = await signUpUser(app);

      const setup = await request(app.getHttpServer())
        .post('/auth/totp/setup')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      const enableCode = generateTotpCode(setup.body.secret);
      const enable = await request(app.getHttpServer())
        .post('/auth/totp/enable')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ code: enableCode })
        .expect(200);

      const oldCodes = enable.body.recoveryCodes;

      const regenCode = generateTotpCode(setup.body.secret);
      const res = await request(app.getHttpServer())
        .post('/auth/totp/recovery-codes')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ code: regenCode })
        .expect(200);

      expect(res.body.recoveryCodes).toHaveLength(8);
      // New codes should be different from old codes
      expect(res.body.recoveryCodes).not.toEqual(oldCodes);
    });

    it('should return 400 for invalid TOTP code', async () => {
      const user = await signUpUser(app);

      const setup = await request(app.getHttpServer())
        .post('/auth/totp/setup')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      const code = generateTotpCode(setup.body.secret);
      await request(app.getHttpServer())
        .post('/auth/totp/enable')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ code })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/totp/recovery-codes')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ code: '000000' })
        .expect(400);
    });
  });

  // ── GET /auth/me with TOTP fields ──

  describe('GET /auth/me (TOTP fields)', () => {
    it('should show totpEnabled=false for new users', async () => {
      const { accessToken } = await signUpUser(app);

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.totpEnabled).toBe(false);
      expect(res.body).not.toHaveProperty('totpSecret');
      expect(res.body).not.toHaveProperty('recoveryCodes');
    });

    it('should show totpEnabled=true after enabling', async () => {
      const { accessToken } = await signUpUser(app);

      const setup = await request(app.getHttpServer())
        .post('/auth/totp/setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const code = generateTotpCode(setup.body.secret);
      await request(app.getHttpServer())
        .post('/auth/totp/enable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.totpEnabled).toBe(true);
      expect(res.body).not.toHaveProperty('totpSecret');
      expect(res.body).not.toHaveProperty('recoveryCodes');
    });
  });
});
