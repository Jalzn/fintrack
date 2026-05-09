import { Wallet } from 'lucide-react';

interface AuthFormShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthFormShell({ title, description, children, footer }: AuthFormShellProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-green to-balance text-white">
          <Wallet className="size-5" />
        </div>
        <span className="font-heading font-semibold text-2xl tracking-tight">fintrack</span>
      </div>

      <div className="space-y-2">
        <h2 className="font-heading font-semibold text-3xl tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <div>{children}</div>

      {footer !== undefined ? (
        <div className="border-t pt-6 text-center text-muted-foreground text-sm">{footer}</div>
      ) : null}
    </div>
  );
}
