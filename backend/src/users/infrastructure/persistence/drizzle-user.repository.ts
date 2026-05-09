import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE_DB } from '@/shared/infrastructure/database/drizzle.tokens';
import type { IUserRepository, User } from '@/users/domain';
import { userRowToDomain, userToRow } from './mappers/user.persistence-mapper';
import { users } from './schema';

export class DrizzleUserRepository implements IUserRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase) {}

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    const row = rows[0];
    return row ? userRowToDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    const row = rows[0];
    return row ? userRowToDomain(row) : null;
  }

  async save(user: User): Promise<void> {
    const row = userToRow(user);
    await this.db.insert(users).values(row).onConflictDoUpdate({ target: users.id, set: row });
  }
}
