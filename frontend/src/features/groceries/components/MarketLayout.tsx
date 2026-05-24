import { useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { GroceryReceipt } from '@/types/api';
import { useGrocerySettingsQuery } from '../hooks/use-grocery-settings-query';
import { GrocerySettingsForm } from './GrocerySettingsForm';
import { GrocerySettingsSheet } from './GrocerySettingsSheet';
import { ReceiptDetailDialog } from './ReceiptDetailDialog';
import { ReceiptUploader } from './ReceiptUploader';

/** Cluster layout shared by the overview, prices and receipts sub-routes. */
export function MarketLayout() {
  const { data: settings, isLoading } = useGrocerySettingsQuery();
  const configured = settings != null;
  const [importedId, setImportedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-semibold text-2xl tracking-tight">Mercado</h1>
          <p className="text-muted-foreground text-sm">
            Importe a foto do cupom fiscal e acompanhe seus gastos e preços de mercado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GrocerySettingsSheet />
          <ReceiptUploader
            onImported={(receipt: GroceryReceipt) => setImportedId(receipt.id)}
            disabled={!configured}
          />
        </div>
      </header>

      {isLoading ? null : configured ? (
        <>
          <MarketNav />
          <Outlet />
        </>
      ) : (
        <MarketFirstRun />
      )}

      <ReceiptDetailDialog
        receiptId={importedId}
        onOpenChange={(open) => {
          if (!open) setImportedId(null);
        }}
      />
    </div>
  );
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'border-b-2 px-1 pb-2 font-medium text-sm transition-colors',
    isActive
      ? 'border-primary text-foreground'
      : 'border-transparent text-muted-foreground hover:text-foreground',
  );

function MarketNav() {
  return (
    <nav className="flex gap-6 border-b">
      <NavLink to="/mercado" end className={navLinkClass}>
        Visão geral
      </NavLink>
      <NavLink to="/mercado/precos" className={navLinkClass}>
        Preços
      </NavLink>
      <NavLink to="/mercado/notas" className={navLinkClass}>
        Notas
      </NavLink>
    </nav>
  );
}

function MarketFirstRun() {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Comece configurando o destino</CardTitle>
        <CardDescription>
          Escolha a categoria e a subcategoria onde as compras de mercado serão lançadas. Depois é
          só tirar a foto do cupom no botão “Importar nota”.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GrocerySettingsForm />
      </CardContent>
    </Card>
  );
}
