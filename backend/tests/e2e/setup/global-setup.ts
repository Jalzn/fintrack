import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

let stopContainer: (() => Promise<void>) | undefined;

export async function setup(): Promise<void> {
  const container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const url = container.getConnectionUri();
  process.env['DATABASE_URL'] = url;
  process.env['JWT_SECRET'] = 'test-secret-that-is-at-least-32-characters-long!!';
  process.env['JWT_EXPIRATION'] = '1h';
  process.env['NODE_ENV'] = 'test';

  const client = postgres(url, { max: 1 });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  await client.end();

  stopContainer = async () => {
    await container.stop();
  };
}

export async function teardown(): Promise<void> {
  await stopContainer?.();
}
