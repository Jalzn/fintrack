import type { IIdGenerator } from '@/shared/application';

export class InMemoryIdGenerator implements IIdGenerator {
  private counter = 0;
  private readonly overrides: string[] = [];

  generate(): string {
    const override = this.overrides.shift();
    if (override !== undefined) return override;
    this.counter += 1;
    return `id-${this.counter}`;
  }

  setNext(id: string): void {
    this.overrides.push(id);
  }

  reset(): void {
    this.counter = 0;
    this.overrides.length = 0;
  }
}
