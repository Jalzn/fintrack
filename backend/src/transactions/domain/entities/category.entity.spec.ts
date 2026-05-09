import { describe, expect, it } from 'vitest';
import { InvalidCategoryError } from '../errors';
import { CategoryCreatedEvent } from '../events';
import { TransactionType } from '../value-objects/transaction-type';
import { Category } from './category.entity';

const validProps = () => ({
  id: 'cat-1',
  userId: 'user-1',
  name: 'Food',
  color: '#FF5733',
  type: TransactionType.EXPENSE,
});

describe('Category.create', () => {
  it('creates a valid category', () => {
    const cat = Category.create(validProps());
    expect(cat.id).toBe('cat-1');
    expect(cat.name).toBe('Food');
    expect(cat.color).toBe('#FF5733');
  });

  it('emits CategoryCreatedEvent', () => {
    const cat = Category.create(validProps());
    expect(cat.domainEvents).toHaveLength(1);
    expect(cat.domainEvents[0]).toBeInstanceOf(CategoryCreatedEvent);
  });

  it('event payload contains correct data', () => {
    const cat = Category.create(validProps());
    const event = cat.domainEvents[0] as CategoryCreatedEvent;
    expect(event.payload.categoryId).toBe('cat-1');
    expect(event.payload.name).toBe('Food');
    expect(event.payload.color).toBe('#FF5733');
  });

  it('accepts shorthand hex color', () => {
    const cat = Category.create({ ...validProps(), color: '#F53' });
    expect(cat.color).toBe('#F53');
  });

  it('throws on empty id', () => {
    expect(() => Category.create({ ...validProps(), id: '' })).toThrow(InvalidCategoryError);
  });

  it('throws on empty userId', () => {
    expect(() => Category.create({ ...validProps(), userId: '' })).toThrow(InvalidCategoryError);
  });

  it('throws on empty name', () => {
    expect(() => Category.create({ ...validProps(), name: '   ' })).toThrow(InvalidCategoryError);
  });

  it('throws on name exceeding 100 characters', () => {
    expect(() => Category.create({ ...validProps(), name: 'a'.repeat(101) })).toThrow(
      InvalidCategoryError,
    );
  });

  it('throws on invalid hex color', () => {
    expect(() => Category.create({ ...validProps(), color: 'red' })).toThrow(InvalidCategoryError);
  });

  it('throws on hex color without #', () => {
    expect(() => Category.create({ ...validProps(), color: 'FF5733' })).toThrow(
      InvalidCategoryError,
    );
  });
});

describe('Category.restore', () => {
  it('restores without validation and emits no events', () => {
    const cat = Category.restore(validProps());
    expect(cat.id).toBe('cat-1');
    expect(cat.domainEvents).toHaveLength(0);
  });
});
