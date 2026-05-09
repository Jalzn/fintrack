import { type ISubcategoryRepository, SubcategoryNotFoundError } from '@/transactions/domain';
import type { SubcategoryDTO } from '../../dtos';
import { toSubcategoryDTO } from '../../mappers';
import { type GetSubcategoryByIdInput, GetSubcategoryByIdInputSchema } from '../../schemas';

interface Deps {
  subcategoryRepository: ISubcategoryRepository;
}

export class GetSubcategoryByIdUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetSubcategoryByIdInput): Promise<SubcategoryDTO> {
    const parsed = GetSubcategoryByIdInputSchema.parse(input);
    const subcategory = await this.deps.subcategoryRepository.findById(parsed.id, parsed.userId);
    if (!subcategory) throw new SubcategoryNotFoundError(parsed.id);
    return toSubcategoryDTO(subcategory);
  }
}
