import type { Money } from '@/shared/domain';
import { AggregateRoot } from '@/shared/domain';
import { InvalidTransactionError } from '../errors';
import { TransactionCreatedEvent, TransactionUpdatedEvent } from '../events';
import type { TransactionType } from '../value-objects/transaction-type';

export interface CreateTransactionProps {
  id: string;
  userId: string;
  amount: Money;
  type: TransactionType;
  categoryId: string;
  subcategoryId?: string | null;
  description: string;
  date: Date;
  linkedTransactionId?: string;
}

export interface UpdateTransactionProps {
  amount?: Money;
  categoryId?: string;
  subcategoryId?: string | null;
  description?: string;
  date?: Date;
}

export interface TransactionProps extends CreateTransactionProps {
  createdAt: Date;
}

export class Transaction extends AggregateRoot {
  private readonly _userId: string;
  private _amount: Money;
  private readonly _type: TransactionType;
  private _categoryId: string;
  private _subcategoryId: string | null;
  private _description: string;
  private _date: Date;
  private readonly _createdAt: Date;
  private readonly _linkedTransactionId: string | undefined;

  private constructor(props: TransactionProps) {
    super(props.id);
    this._userId = props.userId;
    this._amount = props.amount;
    this._type = props.type;
    this._categoryId = props.categoryId;
    this._subcategoryId = props.subcategoryId ?? null;
    this._description = props.description;
    this._date = props.date;
    this._createdAt = props.createdAt;
    this._linkedTransactionId = props.linkedTransactionId;
  }

  private static validate(props: CreateTransactionProps): void {
    if (!props.id.trim()) {
      throw new InvalidTransactionError('Transaction id must not be empty');
    }
    if (!props.userId.trim()) {
      throw new InvalidTransactionError('Transaction userId must not be empty');
    }
    if (parseFloat(props.amount.toDecimal()) <= 0) {
      throw new InvalidTransactionError('Transaction amount must be greater than zero');
    }
    if (!props.categoryId.trim()) {
      throw new InvalidTransactionError('Transaction categoryId must not be empty');
    }
    if (typeof props.subcategoryId === 'string' && !props.subcategoryId.trim()) {
      throw new InvalidTransactionError(
        'Transaction subcategoryId must not be empty when provided',
      );
    }
    if (!props.description.trim() || props.description.length > 255) {
      throw new InvalidTransactionError(
        'Transaction description must be between 1 and 255 characters',
      );
    }
    if (Number.isNaN(props.date.getTime())) {
      throw new InvalidTransactionError('Transaction date must be a valid date');
    }
  }

  static create(props: CreateTransactionProps): Transaction {
    Transaction.validate(props);
    const createdAt = new Date();
    const subcategoryId = props.subcategoryId ?? null;
    const transaction = new Transaction({ ...props, subcategoryId, createdAt });
    transaction.addDomainEvent(
      new TransactionCreatedEvent({
        transactionId: props.id,
        userId: props.userId,
        amount: props.amount.toSnapshot(),
        type: props.type,
        categoryId: props.categoryId,
        subcategoryId,
        description: props.description,
        date: props.date,
        createdAt,
        linkedTransactionId: props.linkedTransactionId,
      }),
    );
    return transaction;
  }

  update(props: UpdateTransactionProps): void {
    const next = {
      amount: props.amount ?? this._amount,
      categoryId: props.categoryId ?? this._categoryId,
      subcategoryId: props.subcategoryId === undefined ? this._subcategoryId : props.subcategoryId,
      description: props.description ?? this._description,
      date: props.date ?? this._date,
    };
    Transaction.validate({ ...this.toSnapshot(), ...next });
    this._amount = next.amount;
    this._categoryId = next.categoryId;
    this._subcategoryId = next.subcategoryId;
    this._description = next.description;
    this._date = next.date;
    this.addDomainEvent(
      new TransactionUpdatedEvent({
        transactionId: this.id,
        userId: this._userId,
        amount: this._amount.toSnapshot(),
        type: this._type,
        categoryId: this._categoryId,
        subcategoryId: this._subcategoryId,
        description: this._description,
        date: this._date,
      }),
    );
  }

  private toSnapshot(): CreateTransactionProps {
    return {
      id: this.id,
      userId: this._userId,
      amount: this._amount,
      type: this._type,
      categoryId: this._categoryId,
      subcategoryId: this._subcategoryId,
      description: this._description,
      date: this._date,
      ...(this._linkedTransactionId !== undefined && {
        linkedTransactionId: this._linkedTransactionId,
      }),
    };
  }

  static restore(props: TransactionProps): Transaction {
    return new Transaction(props);
  }

  get userId(): string {
    return this._userId;
  }
  get amount(): Money {
    return this._amount;
  }
  get type(): TransactionType {
    return this._type;
  }
  get categoryId(): string {
    return this._categoryId;
  }
  get subcategoryId(): string | null {
    return this._subcategoryId;
  }
  get description(): string {
    return this._description;
  }
  get date(): Date {
    return this._date;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get linkedTransactionId(): string | undefined {
    return this._linkedTransactionId;
  }
}
