import type { IIdGenerator } from '@/shared/application';

export class CryptoIdGenerator implements IIdGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}
