import { Controller, Get, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE_DB } from '../database/drizzle.tokens';

@Controller('health')
export class HealthController {
  constructor(@Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase) {}

  @Get()
  async check(): Promise<{ status: string; db: string }> {
    await this.db.execute(sql`SELECT 1`);
    return { status: 'ok', db: 'ok' };
  }
}
