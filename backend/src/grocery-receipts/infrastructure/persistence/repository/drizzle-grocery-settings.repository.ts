import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { GrocerySettings, IGrocerySettingsRepository } from '@/grocery-receipts/domain';
import { DRIZZLE_DB } from '@/shared/infrastructure/database/drizzle.tokens';
import { settingsRowToDomain, settingsToRow } from '../mappers/grocery-settings.persistence-mapper';
import { grocerySettings } from '../schema';

export class DrizzleGrocerySettingsRepository implements IGrocerySettingsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase) {}

  async findByUserId(userId: string): Promise<GrocerySettings | null> {
    const rows = await this.db
      .select()
      .from(grocerySettings)
      .where(eq(grocerySettings.userId, userId))
      .limit(1);
    const row = rows[0];
    return row ? settingsRowToDomain(row) : null;
  }

  async save(settings: GrocerySettings): Promise<void> {
    const row = settingsToRow(settings);
    await this.db
      .insert(grocerySettings)
      .values(row)
      .onConflictDoUpdate({ target: grocerySettings.userId, set: row });
  }
}
