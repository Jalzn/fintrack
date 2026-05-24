import { createBrowserRouter } from 'react-router';
import { AppShell } from '@/components/AppShell';
import { PublicOnly } from '@/components/PublicOnly';
import { RequireAuth } from '@/components/RequireAuth';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { BudgetsPage } from '@/features/budgets/pages/BudgetsPage';
import { CategoriesPage } from '@/features/categories/pages/CategoriesPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { MarketLayout } from '@/features/groceries/components/MarketLayout';
import { MarketOverviewPage } from '@/features/groceries/pages/MarketOverviewPage';
import { PricesPage } from '@/features/groceries/pages/PricesPage';
import { ReceiptsPage } from '@/features/groceries/pages/ReceiptsPage';
import { TransactionsPage } from '@/features/transactions/pages/TransactionsPage';

export const router = createBrowserRouter([
  {
    element: <PublicOnly />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'transacoes', element: <TransactionsPage /> },
          {
            path: 'mercado',
            element: <MarketLayout />,
            children: [
              { index: true, element: <MarketOverviewPage /> },
              { path: 'precos', element: <PricesPage /> },
              { path: 'notas', element: <ReceiptsPage /> },
            ],
          },
          { path: 'orcamentos', element: <BudgetsPage /> },
          { path: 'categorias', element: <CategoriesPage /> },
        ],
      },
    ],
  },
]);
