import { ApplicationError } from '@/shared/application';

export class ReceiptExtractionFailedError extends ApplicationError {
  readonly code = 'RECEIPT_EXTRACTION_FAILED';

  constructor(message = 'Could not extract data from the receipt image') {
    super(message);
    this.name = 'ReceiptExtractionFailedError';
  }
}

export class GrocerySettingsNotConfiguredError extends ApplicationError {
  readonly code = 'GROCERY_SETTINGS_NOT_CONFIGURED';

  constructor() {
    super('Grocery import destination is not configured');
    this.name = 'GrocerySettingsNotConfiguredError';
  }
}
