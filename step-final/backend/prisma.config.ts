import dotenv from 'dotenv';
dotenv.config({ path: '.secrets.env' });
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
