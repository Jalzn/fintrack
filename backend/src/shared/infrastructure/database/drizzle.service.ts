import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

@Injectable()
export class DrizzleService implements OnApplicationShutdown {
  private readonly client: ReturnType<typeof postgres>;
  readonly db: PostgresJsDatabase;

  constructor(@Inject(ConfigService) config: ConfigService) {
    const url = config.getOrThrow<string>('DATABASE_URL');
    this.client = postgres(url, { max: 10 });
    this.db = drizzle(this.client);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.end({ timeout: 5 });
  }
}
