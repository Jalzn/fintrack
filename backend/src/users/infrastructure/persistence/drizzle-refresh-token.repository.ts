import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE_DB } from '@/shared/infrastructure/database/drizzle.tokens';
import type { IRefreshTokenRepository, StoredRefreshToken } from '@/users/domain';
import { refreshTokens } from './schema';

export class DrizzleRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase) {}

  async save(token: StoredRefreshToken): Promise<void> {
    await this.db.insert(refreshTokens).values({
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
    });
  }

  async findByHash(tokenHash: string): Promise<StoredRefreshToken | null> {
    const rows = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return { id: row.id, userId: row.userId, tokenHash: row.tokenHash, expiresAt: row.expiresAt };
  }

  async deleteById(id: string): Promise<void> {
    await this.db.delete(refreshTokens).where(eq(refreshTokens.id, id));
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  }
}
