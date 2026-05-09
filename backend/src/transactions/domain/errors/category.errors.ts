export class InvalidCategoryError extends Error {
  readonly code = 'INVALID_CATEGORY';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidCategoryError';
  }
}

export class CategoryNotFoundError extends Error {
  readonly code = 'CATEGORY_NOT_FOUND';

  constructor(id: string) {
    super(`Category with id "${id}" was not found`);
    this.name = 'CategoryNotFoundError';
  }
}
