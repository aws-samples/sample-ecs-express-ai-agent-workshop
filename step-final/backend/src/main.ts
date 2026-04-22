import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Trust the reverse proxy (Cloud Run, ALB, etc.) so req.protocol
  // reflects the client's HTTPS connection and secure cookies work.
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  const rawOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  const corsOrigin = rawOrigin.includes(',') ? rawOrigin.split(',') : rawOrigin;

  const sessionConfig: session.SessionOptions = {
    secret: process.env.AUTH_SESSION_SECRET ?? 'change-me-session',
    resave: false,
    saveUninitialized: false,
  };

  if (process.env.DATABASE_URL) {
    const PgStore = connectPgSimple(session);
    const prismaService = app.get(PrismaService);
    sessionConfig.store = new PgStore({
      pool: prismaService.getPool(),
      createTableIfMissing: true,
    });
  }

  app.use(session(sessionConfig));

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new I18nValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(
    new I18nValidationExceptionFilter({ detailedErrors: false }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Stub Backend API')
      .setDescription('OAuth2 stub backend REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger UI: http://localhost:${port}/api`);
  }
}
bootstrap();
