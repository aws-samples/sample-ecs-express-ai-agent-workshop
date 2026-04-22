import { existsSync } from 'fs';
import * as path from 'path';
import { Module } from '@nestjs/common';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ItemsModule } from './items/items.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

// Compiled: __dirname = dist/src/ → ../i18n = dist/i18n/
// ts-jest:  __dirname = src/      → ./i18n  = src/i18n/
const i18nPath = existsSync(path.join(__dirname, '..', 'i18n'))
  ? path.join(__dirname, '..', 'i18n')
  : path.join(__dirname, 'i18n');

@Module({
  imports: [
    PrismaModule,
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: i18nPath,
        watch: true,
      },
      resolvers: [
        new QueryResolver(['lang']),
        AcceptLanguageResolver,
      ],
    }),
    UsersModule,
    AuthModule,
    ItemsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
