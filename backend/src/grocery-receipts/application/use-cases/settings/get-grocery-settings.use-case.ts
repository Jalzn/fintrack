import type { IGrocerySettingsRepository } from '@/grocery-receipts/domain';
import type { GrocerySettingsDTO } from '../../dtos';
import { toGrocerySettingsDTO } from '../../mappers';
import { type GetGrocerySettingsInput, GetGrocerySettingsInputSchema } from '../../schemas';

interface Deps {
  grocerySettingsRepository: IGrocerySettingsRepository;
}

export class GetGrocerySettingsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetGrocerySettingsInput): Promise<GrocerySettingsDTO | null> {
    const parsed = GetGrocerySettingsInputSchema.parse(input);
    const settings = await this.deps.grocerySettingsRepository.findByUserId(parsed.userId);
    return settings ? toGrocerySettingsDTO(settings) : null;
  }
}
