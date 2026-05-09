import { CircleAlert } from 'lucide-react';

interface FormErrorBannerProps {
  message: string;
}

export function FormErrorBanner({ message }: FormErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
