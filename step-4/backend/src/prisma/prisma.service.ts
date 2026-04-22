import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;
  private readonly client: PrismaClient;

  get item() {
    return this.client.item;
  }

  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.client = new PrismaClient({
      adapter: new PrismaPg(this.pool as any),
    });
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
    await this.pool.end();
  }
}
