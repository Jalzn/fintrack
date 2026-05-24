import { ApplicationError } from '@/shared/application';

export class DuplicateBudgetError extends ApplicationError {
  readonly code = 'DUPLICATE_BUDGET';

  constructor(
    message = 'A budget already exists for the same category, subcategory, period and currency',
  ) {
    super(message);
    this.name = 'DuplicateBudgetError';
  }
}

export class BudgetCategoryReferenceError extends ApplicationError {
  readonly code = 'BUDGET_INVALID_CATEGORY_REFERENCE';

  constructor(categoryId: string) {
    super(`Category with id "${categoryId}" does not exist`);
    this.name = 'BudgetCategoryReferenceError';
  }
}

export class BudgetSubcategoryReferenceError extends ApplicationError {
  readonly code = 'BUDGET_INVALID_SUBCATEGORY_REFERENCE';

  constructor(subcategoryId: string) {
    super(`Subcategory with id "${subcategoryId}" does not exist`);
    this.name = 'BudgetSubcategoryReferenceError';
  }
}

export class BudgetSubcategoryMismatchError extends ApplicationError {
  readonly code = 'BUDGET_SUBCATEGORY_CATEGORY_MISMATCH';

  constructor(message = 'Subcategory does not belong to the provided category') {
    super(message);
    this.name = 'BudgetSubcategoryMismatchError';
  }
}

export class BudgetCategoryTypeError extends ApplicationError {
  readonly code = 'BUDGET_CATEGORY_NOT_EXPENSE';

  constructor(categoryId: string) {
    super(`Category "${categoryId}" must be of type EXPENSE for a budget`);
    this.name = 'BudgetCategoryTypeError';
  }
}

export class CategoryHasBudgetsError extends ApplicationError {
  readonly code = 'CATEGORY_HAS_BUDGETS';

  constructor(
    categoryId: string,
    public readonly budgetCount: number,
  ) {
    super(`Category "${categoryId}" has ${budgetCount} budget(s) associated`);
    this.name = 'CategoryHasBudgetsError';
  }
}

export class SubcategoryHasBudgetsError extends ApplicationError {
  readonly code = 'SUBCATEGORY_HAS_BUDGETS';

  constructor(
    subcategoryId: string,
    public readonly budgetCount: number,
  ) {
    super(`Subcategory "${subcategoryId}" has ${budgetCount} budget(s) associated`);
    this.name = 'SubcategoryHasBudgetsError';
  }
}
