import { BaseEntity } from '@/shared/domain';
import { InvalidGrocerySettingsError } from '../errors';

export interface GrocerySettingsProps {
  userId: string;
  categoryId: string;
  subcategoryId: string | null;
}

/** Per-user destination for the transaction auto-created when a receipt is imported. */
export class GrocerySettings extends BaseEntity {
  private readonly _categoryId: string;
  private readonly _subcategoryId: string | null;

  private constructor(props: GrocerySettingsProps) {
    super(props.userId);
    this._categoryId = props.categoryId;
    this._subcategoryId = props.subcategoryId;
  }

  private static validate(props: GrocerySettingsProps): void {
    if (!props.userId.trim()) {
      throw new InvalidGrocerySettingsError('GrocerySettings userId must not be empty');
    }
    if (!props.categoryId.trim()) {
      throw new InvalidGrocerySettingsError('GrocerySettings categoryId must not be empty');
    }
  }

  static create(props: GrocerySettingsProps): GrocerySettings {
    GrocerySettings.validate(props);
    return new GrocerySettings(props);
  }

  static restore(props: GrocerySettingsProps): GrocerySettings {
    return new GrocerySettings(props);
  }

  get userId(): string {
    return this.id;
  }
  get categoryId(): string {
    return this._categoryId;
  }
  get subcategoryId(): string | null {
    return this._subcategoryId;
  }
}
