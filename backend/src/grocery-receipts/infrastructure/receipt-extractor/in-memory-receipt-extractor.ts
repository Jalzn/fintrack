import type {
  ExtractedReceipt,
  ExtractReceiptInput,
  IReceiptExtractor,
} from '@/grocery-receipts/application';

/** Test double for IReceiptExtractor. Configure the result with setNext(). */
export class FakeReceiptExtractor implements IReceiptExtractor {
  private next: ExtractedReceipt | null = null;
  lastInput: ExtractReceiptInput | null = null;

  setNext(receipt: ExtractedReceipt): void {
    this.next = receipt;
  }

  async extract(input: ExtractReceiptInput): Promise<ExtractedReceipt> {
    this.lastInput = input;
    if (this.next === null) {
      throw new Error('FakeReceiptExtractor: no result configured (call setNext first)');
    }
    return this.next;
  }
}
