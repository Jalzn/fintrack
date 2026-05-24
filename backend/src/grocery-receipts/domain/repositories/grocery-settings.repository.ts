import type { GrocerySettings } from '../entities';

export interface IGrocerySettingsRepository {
  findByUserId(userId: string): Promise<GrocerySettings | null>;
  save(settings: GrocerySettings): Promise<void>;
}
