import imageCompression from 'browser-image-compression';
import { Camera, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import type { GroceryReceipt } from '@/types/api';
import { useImportReceiptMutation } from '../hooks/use-import-receipt';

async function fileToCompressedBase64(file: File): Promise<string> {
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 1.5,
    useWebWorker: true,
    fileType: 'image/jpeg',
  });
  const dataUrl = await imageCompression.getDataUrlFromFile(compressed);
  return dataUrl.replace(/^data:[^;]+;base64,/, '');
}

interface ReceiptUploaderProps {
  onImported: (receipt: GroceryReceipt) => void;
  disabled?: boolean;
}

export function ReceiptUploader({ onImported, disabled = false }: ReceiptUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const mutation = useImportReceiptMutation();
  const busy = processing || mutation.isPending;

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem do cupom.');
      return;
    }

    try {
      setProcessing(true);
      const imageBase64 = await fileToCompressedBase64(file);
      setProcessing(false);
      const receipt = await mutation.mutateAsync({ imageBase64, mimeType: 'image/jpeg' });
      toast.success('Nota lida e transação criada');
      onImported(receipt);
    } catch (error) {
      setProcessing(false);
      if (error instanceof ApiError && error.status === 422) {
        toast.error('Não consegui ler o total do cupom. Tente uma foto mais nítida.');
      } else if (error instanceof ApiError && error.status === 409) {
        toast.error('Configure a categoria de destino antes de importar.');
      } else if (error instanceof ApiError && error.status === 413) {
        toast.error('Imagem muito grande. Tente uma foto menor.');
      } else {
        toast.error('Erro ao importar a nota.');
      }
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Foto do cupom"
        className="hidden"
        onChange={(event) => {
          void handleFile(event);
        }}
      />
      <Button
        onClick={() => inputRef.current?.click()}
        disabled={busy || disabled}
        className="gap-2"
      >
        {busy ? (
          <Loader2 aria-hidden className="size-4 animate-spin" />
        ) : (
          <Camera aria-hidden className="size-4" />
        )}
        {busy ? 'Lendo nota...' : 'Importar nota'}
      </Button>
    </>
  );
}
