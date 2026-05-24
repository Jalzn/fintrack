export class InvalidBudgetError extends Error {
  readonly code = 'INVALID_BUDGET';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidBudgetError';
  }
}

export class BudgetNotFoundError extends Error {
  readonly code = 'BUDGET_NOT_FOUND';

  constructor(id: string) {
    super(`Budget with id "${id}" was not found`);
    this.name = 'BudgetNotFoundError';
  }
}
