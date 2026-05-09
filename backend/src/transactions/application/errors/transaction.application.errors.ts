import { ApplicationError } from '@/shared/application';

export class InvalidCategoryReferenceError extends ApplicationError {
  readonly code = 'INVALID_CATEGORY_REFERENCE';

  constructor(categoryId: string) {
    super(`Category with id "${categoryId}" does not exist`);
    this.name = 'InvalidCategoryReferenceError';
  }
}

export class CategoryInUseError extends ApplicationError {
  readonly code = 'CATEGORY_IN_USE';

  constructor(
    categoryId: string,
    public readonly transactionCount: number,
  ) {
    super(`Category "${categoryId}" is referenced by ${transactionCount} transaction(s)`);
    this.name = 'CategoryInUseError';
  }
}

export class CategoryHasSubcategoriesError extends ApplicationError {
  readonly code = 'CATEGORY_HAS_SUBCATEGORIES';

  constructor(
    categoryId: string,
    public readonly subcategoryCount: number,
  ) {
    super(`Category "${categoryId}" has ${subcategoryCount} subcategory/subcategories`);
    this.name = 'CategoryHasSubcategoriesError';
  }
}

export class InvalidSubcategoryReferenceError extends ApplicationError {
  readonly code = 'INVALID_SUBCATEGORY_REFERENCE';

  constructor(subcategoryId: string) {
    super(`Subcategory with id "${subcategoryId}" does not exist`);
    this.name = 'InvalidSubcategoryReferenceError';
  }
}

export class SubcategoryInUseError extends ApplicationError {
  readonly code = 'SUBCATEGORY_IN_USE';

  constructor(
    subcategoryId: string,
    public readonly transactionCount: number,
  ) {
    super(`Subcategory "${subcategoryId}" is referenced by ${transactionCount} transaction(s)`);
    this.name = 'SubcategoryInUseError';
  }
}

export class SubcategoryCategoryMismatchError extends ApplicationError {
  readonly code = 'SUBCATEGORY_CATEGORY_MISMATCH';

  constructor(message = 'Subcategory does not belong to the provided category') {
    super(message);
    this.name = 'SubcategoryCategoryMismatchError';
  }
}

export class SubcategoryNameAlreadyExistsError extends ApplicationError {
  readonly code = 'SUBCATEGORY_NAME_ALREADY_EXISTS';

  constructor(name: string) {
    super(`A subcategory with name "${name}" already exists in this category`);
    this.name = 'SubcategoryNameAlreadyExistsError';
  }
}
