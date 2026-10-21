import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  readonly db: ReturnType<typeof drizzle>;

  constructor(private readonly config: ConfigService) {
    this.pool = new Pool({
      connectionString: this.config.get('DATABASE_URL'),
    });

    this.db = drizzle({ client: this.pool });
  }

  async onModuleInit() {
    await this.pool.connect();
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
