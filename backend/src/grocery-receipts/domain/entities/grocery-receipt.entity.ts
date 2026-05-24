import type { Money } from '@/shared/domain';
import { BaseEntity } from '@/shared/domain';
import { InvalidGroceryReceiptError } from '../errors';
import type { GroceryItem } from './grocery-item.entity';

export interface CreateGroceryReceiptProps {
  id: string;
  userId: string;
  storeName: string;
  purchaseDate: Date;
  total: Money;
  items: GroceryItem[];
}

export interface GroceryReceiptProps extends CreateGroceryReceiptProps {
  transactionId: string | null;
  createdAt: Date;
}

export class GroceryReceipt extends BaseEntity {
  private readonly _userId: string;
  private readonly _storeName: string;
  private readonly _purchaseDate: Date;
  private readonly _total: Money;
  private _transactionId: string | null;
  private readonly _items: GroceryItem[];
  private readonly _createdAt: Date;

  private constructor(props: GroceryReceiptProps) {
    super(props.id);
    this._userId = props.userId;
    this._storeName = props.storeName;
    this._purchaseDate = props.purchaseDate;
    this._total = props.total;
    this._transactionId = props.transactionId;
    this._items = [...props.items];
    this._createdAt = props.createdAt;
  }

  private static validate(props: CreateGroceryReceiptProps): void {
    if (!props.id.trim()) {
      throw new InvalidGroceryReceiptError('GroceryReceipt id must not be empty');
    }
    if (!props.userId.trim()) {
      throw new InvalidGroceryReceiptError('GroceryReceipt userId must not be empty');
    }
    if (!props.storeName.trim() || props.storeName.length > 255) {
      throw new InvalidGroceryReceiptError(
        'GroceryReceipt storeName must be between 1 and 255 characters',
      );
    }
    if (Number.isNaN(props.purchaseDate.getTime())) {
      throw new InvalidGroceryReceiptError('GroceryReceipt purchaseDate must be a valid date');
    }
    if (parseFloat(props.total.toDecimal()) <= 0) {
      throw new InvalidGroceryReceiptError('GroceryReceipt total must be greater than zero');
    }
  }

  static create(props: CreateGroceryReceiptProps): GroceryReceipt {
    GroceryReceipt.validate(props);
    return new GroceryReceipt({ ...props, transactionId: null, createdAt: new Date() });
  }

  linkTransaction(transactionId: string): void {
    if (this._transactionId !== null) {
      throw new InvalidGroceryReceiptError('GroceryReceipt is already linked to a transaction');
    }
    if (!transactionId.trim()) {
      throw new InvalidGroceryReceiptError('transactionId must not be empty');
    }
    this._transactionId = transactionId;
  }

  static restore(props: GroceryReceiptProps): GroceryReceipt {
    return new GroceryReceipt(props);
  }

  get userId(): string {
    return this._userId;
  }
  get storeName(): string {
    return this._storeName;
  }
  get purchaseDate(): Date {
    return this._purchaseDate;
  }
  get total(): Money {
    return this._total;
  }
  get transactionId(): string | null {
    return this._transactionId;
  }
  get items(): GroceryItem[] {
    return [...this._items];
  }
  get createdAt(): Date {
    return this._createdAt;
  }
}
