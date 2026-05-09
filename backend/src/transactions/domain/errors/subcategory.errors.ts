export class InvalidSubcategoryError extends Error {
  readonly code = 'INVALID_SUBCATEGORY';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidSubcategoryError';
  }
}

export class SubcategoryNotFoundError extends Error {
  readonly code = 'SUBCATEGORY_NOT_FOUND';

  constructor(id: string) {
    super(`Subcategory with id "${id}" was not found`);
    this.name = 'SubcategoryNotFoundError';
  }
}
