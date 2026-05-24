import type { BudgetScope } from '@/budgets/domain';
import {
  type ICategoryRepository,
  type ISubcategoryRepository,
  TransactionType,
} from '@/transactions/domain';
import {
  BudgetCategoryReferenceError,
  BudgetCategoryTypeError,
  BudgetSubcategoryMismatchError,
  BudgetSubcategoryReferenceError,
} from '../errors';
import type { BudgetScopeInput } from '../schemas';

interface Deps {
  categoryRepository: ICategoryRepository;
  subcategoryRepository: ISubcategoryRepository;
}

/**
 * Validates each requested scope (category exists and is EXPENSE; subcategory exists
 * and belongs to the category) and returns the normalized domain scopes.
 */
export async function resolveBudgetScopes(
  deps: Deps,
  userId: string,
  scopeInputs: BudgetScopeInput[],
): Promise<BudgetScope[]> {
  const result: BudgetScope[] = [];
  for (const scope of scopeInputs) {
    const category = await deps.categoryRepository.findById(scope.categoryId, userId);
    if (!category) throw new BudgetCategoryReferenceError(scope.categoryId);
    if (category.type !== TransactionType.EXPENSE) {
      throw new BudgetCategoryTypeError(scope.categoryId);
    }

    let subcategoryId: string | null = null;
    if (typeof scope.subcategoryId === 'string') {
      const sub = await deps.subcategoryRepository.findById(scope.subcategoryId, userId);
      if (!sub) throw new BudgetSubcategoryReferenceError(scope.subcategoryId);
      if (sub.categoryId !== scope.categoryId) throw new BudgetSubcategoryMismatchError();
      subcategoryId = sub.id;
    }

    result.push({ categoryId: scope.categoryId, subcategoryId });
  }
  return result;
}
