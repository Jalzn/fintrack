import type { IGroceryReceiptRepository } from '@/grocery-receipts/domain';
import type { PaginatedResult } from '@/shared/application';
import type { GroceryReceiptDTO } from '../../dtos';
import { toGroceryReceiptDTO } from '../../mappers';
import { type ListReceiptsInput, ListReceiptsInputSchema } from '../../schemas';

interface Deps {
  groceryReceiptRepository: IGroceryReceiptRepository;
}

export class ListReceiptsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ListReceiptsInput): Promise<PaginatedResult<GroceryReceiptDTO>> {
    const parsed = ListReceiptsInputSchema.parse(input);

    const { data, total } = await this.deps.groceryReceiptRepository.findAll({
      userId: parsed.userId,
      page: parsed.page,
      limit: parsed.limit,
      ...(parsed.startDate !== undefined && { startDate: parsed.startDate }),
      ...(parsed.endDate !== undefined && { endDate: parsed.endDate }),
    });

    return {
      data: data.map(toGroceryReceiptDTO),
      total,
      page: parsed.page,
      limit: parsed.limit,
      totalPages: Math.ceil(total / parsed.limit),
    };
  }
}
