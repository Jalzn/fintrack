import type Anthropic from '@anthropic-ai/sdk';
import type { PinoLogger } from 'nestjs-pino';
import {
  type ExtractedReceipt,
  ExtractedReceiptSchema,
  type ExtractReceiptInput,
  type IReceiptExtractor,
  ReceiptExtractionFailedError,
} from '@/grocery-receipts/application';
import { RECEIPT_SYSTEM_PROMPT, RECEIPT_TOOL } from './receipt-extractor.prompt';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;

export class ClaudeReceiptExtractor implements IReceiptExtractor {
  constructor(
    private readonly client: Anthropic,
    private readonly logger?: PinoLogger,
  ) {}

  async extract({ imageBase64, mimeType }: ExtractReceiptInput): Promise<ExtractedReceipt> {
    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: [
          { type: 'text', text: RECEIPT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
        ],
        tools: [RECEIPT_TOOL],
        tool_choice: { type: 'tool', name: RECEIPT_TOOL.name },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mimeType, data: imageBase64 },
              },
              {
                type: 'text',
                text: 'Extraia os dados deste cupom fiscal usando a ferramenta record_receipt.',
              },
            ],
          },
        ],
      });
    } catch (error) {
      this.logger?.error({ err: error }, 'Claude receipt extraction request failed');
      throw new ReceiptExtractionFailedError();
    }

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );
    if (!toolUse) {
      this.logger?.error({ messageId: response.id }, 'Claude returned no tool_use block');
      throw new ReceiptExtractionFailedError('model returned no structured output');
    }

    const parsed = ExtractedReceiptSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      this.logger?.error(
        { messageId: response.id, issues: parsed.error.issues },
        'Claude output failed schema validation',
      );
      throw new ReceiptExtractionFailedError('model output did not match the expected schema');
    }

    this.logger?.info(
      { messageId: response.id, cacheRead: response.usage.cache_read_input_tokens },
      'Receipt extracted',
    );
    return parsed.data;
  }
}
