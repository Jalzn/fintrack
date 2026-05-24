import type { ExtractedReceipt } from '../schemas/extracted-receipt.schema';

export interface ExtractReceiptInput {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface IReceiptExtractor {
  extract(input: ExtractReceiptInput): Promise<ExtractedReceipt>;
}
