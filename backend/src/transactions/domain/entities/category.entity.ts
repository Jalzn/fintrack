import { AggregateRoot } from '@/shared/domain';
import { InvalidCategoryError } from '../errors';
import { CategoryCreatedEvent, CategoryUpdatedEvent } from '../events';
import type { TransactionType } from '../value-objects';

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

export interface CategoryProps {
  id: string;
  userId: string;
  name: string;
  color: string;
  type: TransactionType;
}

export interface UpdateCategoryProps {
  name?: string;
  color?: string;
}

export class Category extends AggregateRoot {
  private readonly _userId: string;
  private _name: string;
  private _color: string;
  private readonly _type: TransactionType;

  private constructor(props: CategoryProps) {
    super(props.id);
    this._userId = props.userId;
    this._name = props.name;
    this._color = props.color;
    this._type = props.type;
  }

  private static validate(props: CategoryProps): void {
    if (!props.id.trim()) {
      throw new InvalidCategoryError('Category id must not be empty');
    }
    if (!props.userId.trim()) {
      throw new InvalidCategoryError('Category userId must not be empty');
    }
    if (!props.name.trim() || props.name.length > 100) {
      throw new InvalidCategoryError('Category name must be between 1 and 100 characters');
    }
    if (!HEX_COLOR_REGEX.test(props.color)) {
      throw new InvalidCategoryError(
        'Category color must be a valid hex color (e.g. #RGB or #RRGGBB)',
      );
    }
  }

  static create(props: CategoryProps): Category {
    Category.validate(props);
    const category = new Category(props);
    category.addDomainEvent(
      new CategoryCreatedEvent({
        categoryId: props.id,
        userId: props.userId,
        name: props.name,
        color: props.color,
        type: props.type,
      }),
    );
    return category;
  }

  update(props: UpdateCategoryProps): void {
    const next = {
      id: this.id,
      userId: this._userId,
      name: props.name ?? this._name,
      color: props.color ?? this._color,
      type: this._type,
    };
    Category.validate(next);
    this._name = next.name;
    this._color = next.color;
    this.addDomainEvent(
      new CategoryUpdatedEvent({
        categoryId: this.id,
        userId: this._userId,
        name: this._name,
        color: this._color,
        type: this._type,
      }),
    );
  }

  static restore(props: CategoryProps): Category {
    return new Category(props);
  }

  get userId(): string {
    return this._userId;
  }
  get name(): string {
    return this._name;
  }
  get color(): string {
    return this._color;
  }
  get type(): TransactionType {
    return this._type;
  }
}
