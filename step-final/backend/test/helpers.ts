import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';

let emailCounter = 0;

export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}_${Date.now()}_${++emailCounter}@test.example`;
}

/**
 * Sign up a user and immediately verify their email so they can sign in.
 * Returns tokens from the subsequent sign-in call.
 */
export async function signUpUser(
  app: INestApplication,
  overrides: { email?: string; password?: string; name?: string } = {},
) {
  const email = overrides.email ?? uniqueEmail();
  const password = overrides.password ?? 'TestPass123';
  const name = overrides.name;

  await request(app.getHttpServer())
    .post('/auth/signup')
    .send({ email, password, name })
    .expect(201);

  // Directly verify the email in the database (no Mailpit in backend e2e tests)
  const prisma = app.get(PrismaService);
  await prisma.user.update({
    where: { email },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  });

  // Sign in to get tokens
  const res = await request(app.getHttpServer())
    .post('/auth/signin')
    .send({ email, password })
    .expect(201);

  return {
    ...res.body,
    email,
    password,
  };
}

export async function signInUser(
  app: INestApplication,
  email: string,
  password: string,
) {
  const res = await request(app.getHttpServer())
    .post('/auth/signin')
    .send({ email, password })
    .expect(201);

  return res.body;
}

export async function cleanDatabase(prisma: PrismaService) {
  // Delete in dependency order (children before parents)
  await prisma.item.deleteMany();
  await prisma.socialAccount.deleteMany();
  await prisma.user.deleteMany();
}
