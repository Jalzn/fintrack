export class InvalidGroceryReceiptError extends Error {
  readonly code = 'INVALID_GROCERY_RECEIPT';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidGroceryReceiptError';
  }
}

export class GroceryReceiptNotFoundError extends Error {
  readonly code = 'GROCERY_RECEIPT_NOT_FOUND';

  constructor(id: string) {
    super(`Grocery receipt with id "${id}" was not found`);
    this.name = 'GroceryReceiptNotFoundError';
  }
}

export class InvalidGrocerySettingsError extends Error {
  readonly code = 'INVALID_GROCERY_SETTINGS';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidGrocerySettingsError';
  }
}
