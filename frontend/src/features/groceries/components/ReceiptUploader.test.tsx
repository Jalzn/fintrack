import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReceiptUploader } from './ReceiptUploader';

vi.mock('browser-image-compression', () => {
  const compress = vi.fn(async (file: File) => file);
  return {
    default: Object.assign(compress, {
      getDataUrlFromFile: vi.fn(async () => 'data:image/jpeg;base64,QUJD'),
    }),
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const receipt = {
  id: 'r1',
  storeName: 'Mercado X',
  purchaseDate: '2026-05-20T00:00:00.000Z',
  total: { amount: 1935, currency: { code: 'BRL', base: 10, exponent: 2 } },
  transactionId: 'tx1',
  createdAt: '2026-05-20T00:00:00.000Z',
  items: [],
};

function renderUploader(onImported = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ReceiptUploader onImported={onImported} />
    </QueryClientProvider>,
  );
  return onImported;
}

function selectFile() {
  const input = screen.getByLabelText('Foto do cupom');
  const file = new File(['x'], 'cupom.jpg', { type: 'image/jpeg' });
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  fireEvent.change(input);
}

describe('ReceiptUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('imports the receipt and reports success on the golden path', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => receipt })),
    );

    const onImported = renderUploader();
    selectFile();

    await waitFor(() =>
      expect(onImported).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' })),
    );
    expect(toast.success).toHaveBeenCalledWith('Nota lida e transação criada');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/grocery-receipts'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('shows a friendly error when the receipt cannot be read (422)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({ message: 'fail', error: 'RECEIPT_EXTRACTION_FAILED' }),
      })),
    );

    const onImported = renderUploader();
    selectFile();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Não consegui ler o total do cupom. Tente uma foto mais nítida.',
      ),
    );
    expect(onImported).not.toHaveBeenCalled();
  });
});
