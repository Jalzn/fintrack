import type { GrocerySettings, IGrocerySettingsRepository } from '@/grocery-receipts/domain';

export class InMemoryGrocerySettingsRepository implements IGrocerySettingsRepository {
  private readonly store = new Map<string, GrocerySettings>();

  async findByUserId(userId: string): Promise<GrocerySettings | null> {
    return this.store.get(userId) ?? null;
  }

  async save(settings: GrocerySettings): Promise<void> {
    this.store.set(settings.userId, settings);
  }

  seed(settings: GrocerySettings[]): void {
    for (const item of settings) {
      this.store.set(item.userId, item);
    }
  }
}
