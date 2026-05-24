import {
  GroceryReceiptNotFoundError,
  type IGroceryReceiptRepository,
} from '@/grocery-receipts/domain';
import type { GroceryReceiptDTO } from '../../dtos';
import { toGroceryReceiptDTO } from '../../mappers';
import { type GetReceiptByIdInput, GetReceiptByIdInputSchema } from '../../schemas';

interface Deps {
  groceryReceiptRepository: IGroceryReceiptRepository;
}

export class GetReceiptByIdUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetReceiptByIdInput): Promise<GroceryReceiptDTO> {
    const parsed = GetReceiptByIdInputSchema.parse(input);
    const receipt = await this.deps.groceryReceiptRepository.findById(parsed.id, parsed.userId);
    if (!receipt) throw new GroceryReceiptNotFoundError(parsed.id);
    return toGroceryReceiptDTO(receipt);
  }
}
