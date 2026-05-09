export class InvalidTransactionError extends Error {
  readonly code = 'INVALID_TRANSACTION';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidTransactionError';
  }
}

export class TransactionNotFoundError extends Error {
  readonly code = 'TRANSACTION_NOT_FOUND';

  constructor(id: string) {
    super(`Transaction with id "${id}" was not found`);
    this.name = 'TransactionNotFoundError';
  }
}
