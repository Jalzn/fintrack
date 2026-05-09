import { AggregateRoot } from '@/shared/domain';
import { InvalidSubcategoryError } from '../errors';
import { SubcategoryCreatedEvent, SubcategoryUpdatedEvent } from '../events';

export interface SubcategoryProps {
  id: string;
  userId: string;
  categoryId: string;
  name: string;
}

export interface UpdateSubcategoryProps {
  name?: string;
}

export class Subcategory extends AggregateRoot {
  private readonly _userId: string;
  private readonly _categoryId: string;
  private _name: string;

  private constructor(props: SubcategoryProps) {
    super(props.id);
    this._userId = props.userId;
    this._categoryId = props.categoryId;
    this._name = props.name;
  }

  private static validate(props: SubcategoryProps): void {
    if (!props.id.trim()) {
      throw new InvalidSubcategoryError('Subcategory id must not be empty');
    }
    if (!props.userId.trim()) {
      throw new InvalidSubcategoryError('Subcategory userId must not be empty');
    }
    if (!props.categoryId.trim()) {
      throw new InvalidSubcategoryError('Subcategory categoryId must not be empty');
    }
    if (!props.name.trim() || props.name.length > 100) {
      throw new InvalidSubcategoryError('Subcategory name must be between 1 and 100 characters');
    }
  }

  static create(props: SubcategoryProps): Subcategory {
    Subcategory.validate(props);
    const subcategory = new Subcategory(props);
    subcategory.addDomainEvent(
      new SubcategoryCreatedEvent({
        subcategoryId: props.id,
        userId: props.userId,
        categoryId: props.categoryId,
        name: props.name,
      }),
    );
    return subcategory;
  }

  update(props: UpdateSubcategoryProps): void {
    const next = {
      id: this.id,
      userId: this._userId,
      categoryId: this._categoryId,
      name: props.name ?? this._name,
    };
    Subcategory.validate(next);
    this._name = next.name;
    this.addDomainEvent(
      new SubcategoryUpdatedEvent({
        subcategoryId: this.id,
        userId: this._userId,
        categoryId: this._categoryId,
        name: this._name,
      }),
    );
  }

  static restore(props: SubcategoryProps): Subcategory {
    return new Subcategory(props);
  }

  get userId(): string {
    return this._userId;
  }
  get categoryId(): string {
    return this._categoryId;
  }
  get name(): string {
    return this._name;
  }
}
