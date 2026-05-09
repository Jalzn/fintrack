import { Inject } from '@nestjs/common';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE_DB } from '@/shared/infrastructure/database/drizzle.tokens';
import type { IUserRegistrar } from '@/users/application';
import type { StoredRefreshToken, User } from '@/users/domain';
import { userToRow } from './mappers/user.persistence-mapper';
import { refreshTokens, users } from './schema';

export class DrizzleUserRegistrar implements IUserRegistrar {
  constructor(@Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase) {}

  async register(user: User, token: StoredRefreshToken): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(users).values(userToRow(user));
      await tx.insert(refreshTokens).values({
        id: token.id,
        userId: token.userId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
      });
    });
  }
}
