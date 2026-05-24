import type { Money } from '@/shared/domain';
import { BaseEntity } from '@/shared/domain';
import { InvalidGroceryReceiptError } from '../errors';
import { type GroceryDepartment, type GroceryUnit, isGroceryDepartment } from '../value-objects';

export interface GroceryItemProps {
  id: string;
  receiptId: string;
  rawDescription: string;
  normalizedName: string;
  quantity: number;
  unit: GroceryUnit;
  unitPrice: Money;
  lineTotal: Money;
  brand?: string | null;
  code?: string | null;
  department?: GroceryDepartment | null;
  size?: string | null;
}

export class GroceryItem extends BaseEntity {
  private readonly _receiptId: string;
  private readonly _rawDescription: string;
  private readonly _normalizedName: string;
  private readonly _quantity: number;
  private readonly _unit: GroceryUnit;
  private readonly _unitPrice: Money;
  private readonly _lineTotal: Money;
  private readonly _brand: string | null;
  private readonly _code: string | null;
  private readonly _department: GroceryDepartment | null;
  private readonly _size: string | null;

  private constructor(props: GroceryItemProps) {
    super(props.id);
    this._receiptId = props.receiptId;
    this._rawDescription = props.rawDescription;
    this._normalizedName = props.normalizedName;
    this._quantity = props.quantity;
    this._unit = props.unit;
    this._unitPrice = props.unitPrice;
    this._lineTotal = props.lineTotal;
    this._brand = props.brand ?? null;
    this._code = props.code ?? null;
    this._department = props.department ?? null;
    this._size = props.size ?? null;
  }

  private static validate(props: GroceryItemProps): void {
    if (!props.id.trim()) {
      throw new InvalidGroceryReceiptError('GroceryItem id must not be empty');
    }
    if (!props.receiptId.trim()) {
      throw new InvalidGroceryReceiptError('GroceryItem receiptId must not be empty');
    }
    if (!props.rawDescription.trim()) {
      throw new InvalidGroceryReceiptError('GroceryItem rawDescription must not be empty');
    }
    if (!props.normalizedName.trim()) {
      throw new InvalidGroceryReceiptError('GroceryItem normalizedName must not be empty');
    }
    if (!(props.quantity > 0)) {
      throw new InvalidGroceryReceiptError('GroceryItem quantity must be greater than zero');
    }
    if (parseFloat(props.unitPrice.toDecimal()) < 0) {
      throw new InvalidGroceryReceiptError('GroceryItem unitPrice must not be negative');
    }
    if (parseFloat(props.lineTotal.toDecimal()) < 0) {
      throw new InvalidGroceryReceiptError('GroceryItem lineTotal must not be negative');
    }
    if (props.department != null && !isGroceryDepartment(props.department)) {
      throw new InvalidGroceryReceiptError(
        `GroceryItem department is invalid: ${props.department}`,
      );
    }
  }

  static create(props: GroceryItemProps): GroceryItem {
    GroceryItem.validate(props);
    return new GroceryItem(props);
  }

  static restore(props: GroceryItemProps): GroceryItem {
    return new GroceryItem(props);
  }

  get receiptId(): string {
    return this._receiptId;
  }
  get rawDescription(): string {
    return this._rawDescription;
  }
  get normalizedName(): string {
    return this._normalizedName;
  }
  get quantity(): number {
    return this._quantity;
  }
  get unit(): GroceryUnit {
    return this._unit;
  }
  get unitPrice(): Money {
    return this._unitPrice;
  }
  get lineTotal(): Money {
    return this._lineTotal;
  }
  get brand(): string | null {
    return this._brand;
  }
  get code(): string | null {
    return this._code;
  }
  get department(): GroceryDepartment | null {
    return this._department;
  }
  get size(): string | null {
    return this._size;
  }
}
