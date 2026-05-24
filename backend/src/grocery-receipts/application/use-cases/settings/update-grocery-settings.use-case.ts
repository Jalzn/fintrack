import { GrocerySettings, type IGrocerySettingsRepository } from '@/grocery-receipts/domain';
import {
  InvalidCategoryReferenceError,
  InvalidSubcategoryReferenceError,
  SubcategoryCategoryMismatchError,
} from '@/transactions/application';
import type { ICategoryRepository, ISubcategoryRepository } from '@/transactions/domain';
import type { GrocerySettingsDTO } from '../../dtos';
import { toGrocerySettingsDTO } from '../../mappers';
import { type UpdateGrocerySettingsInput, UpdateGrocerySettingsInputSchema } from '../../schemas';

interface Deps {
  grocerySettingsRepository: IGrocerySettingsRepository;
  categoryRepository: ICategoryRepository;
  subcategoryRepository: ISubcategoryRepository;
}

export class UpdateGrocerySettingsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateGrocerySettingsInput): Promise<GrocerySettingsDTO> {
    const parsed = UpdateGrocerySettingsInputSchema.parse(input);

    const category = await this.deps.categoryRepository.findById(parsed.categoryId, parsed.userId);
    if (!category) throw new InvalidCategoryReferenceError(parsed.categoryId);

    let subcategoryId: string | null = null;
    if (typeof parsed.subcategoryId === 'string') {
      const subcategory = await this.deps.subcategoryRepository.findById(
        parsed.subcategoryId,
        parsed.userId,
      );
      if (!subcategory) throw new InvalidSubcategoryReferenceError(parsed.subcategoryId);
      if (subcategory.categoryId !== parsed.categoryId) {
        throw new SubcategoryCategoryMismatchError();
      }
      subcategoryId = subcategory.id;
    }

    const settings = GrocerySettings.create({
      userId: parsed.userId,
      categoryId: parsed.categoryId,
      subcategoryId,
    });
    await this.deps.grocerySettingsRepository.save(settings);
    return toGrocerySettingsDTO(settings);
  }
}
