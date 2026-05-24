import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

const url = process.env['DATABASE_URL'] ?? 'postgresql://localhost:5432/fintrack';

export default defineConfig({
  dialect: 'postgresql',
  schema: [
    './src/transactions/infrastructure/persistence/schema/index.ts',
    './src/users/infrastructure/persistence/schema/index.ts',
    './src/budgets/infrastructure/persistence/schema/index.ts',
    './src/grocery-receipts/infrastructure/persistence/schema/index.ts',
  ],
  out: './drizzle/migrations',
  dbCredentials: { url },
});
