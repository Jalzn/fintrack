import 'dotenv/config';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Budget } from '@/budgets/domain';
import { DrizzleBudgetRepository } from '@/budgets/infrastructure/persistence/repository/drizzle-budget.repository';
import { budgets } from '@/budgets/infrastructure/persistence/schema';
import {
  GroceryDepartment,
  GroceryItem,
  GroceryReceipt,
  GrocerySettings,
  GroceryUnit,
} from '@/grocery-receipts/domain';
import { DrizzleGroceryReceiptRepository } from '@/grocery-receipts/infrastructure/persistence/repository/drizzle-grocery-receipt.repository';
import { DrizzleGrocerySettingsRepository } from '@/grocery-receipts/infrastructure/persistence/repository/drizzle-grocery-settings.repository';
import {
  groceryReceipts,
  grocerySettings,
} from '@/grocery-receipts/infrastructure/persistence/schema';
import { BRL, Money } from '@/shared/domain';
import { CryptoIdGenerator } from '@/shared/infrastructure/id/crypto-id.generator';
import { Category, Subcategory, Transaction, TransactionType } from '@/transactions/domain';
import { DrizzleCategoryRepository } from '@/transactions/infrastructure/persistence/repository/drizzle-category.repository';
import { DrizzleSubcategoryRepository } from '@/transactions/infrastructure/persistence/repository/drizzle-subcategory.repository';
import { DrizzleTransactionRepository } from '@/transactions/infrastructure/persistence/repository/drizzle-transaction.repository';
import {
  categories,
  subcategories,
  transactions,
} from '@/transactions/infrastructure/persistence/schema';
import { User } from '@/users/domain';
import { DrizzleUserRepository } from '@/users/infrastructure/persistence/drizzle-user.repository';
import { refreshTokens, users } from '@/users/infrastructure/persistence/schema';

const DEMO_EMAIL = process.env['SEED_EMAIL'] ?? 'demo@fintrack.local';
const DEMO_PASSWORD = process.env['SEED_PASSWORD'] ?? 'demo12345';
/** How many months of history to generate (current month + the previous N-1). */
const MONTHS = Number(process.env['SEED_MONTHS'] ?? 6);

const url = process.env['DATABASE_URL'];
if (!url) throw new Error('DATABASE_URL is required');

// Deterministic output: the same seed produces the same dataset on every run.
faker.seed(20260523);

const idGen = new CryptoIdGenerator();
const client = postgres(url, { max: 5 });
const db = drizzle(client);

const userRepo = new DrizzleUserRepository(db);
const categoryRepo = new DrizzleCategoryRepository(db);
const subcategoryRepo = new DrizzleSubcategoryRepository(db);
const transactionRepo = new DrizzleTransactionRepository(db);
const budgetRepo = new DrizzleBudgetRepository(db);
const groceryReceiptRepo = new DrizzleGroceryReceiptRepository(db);
const grocerySettingsRepo = new DrizzleGrocerySettingsRepository(db);

const INCOME = TransactionType.INCOME;
const EXPENSE = TransactionType.EXPENSE;

/** Reais → minor units (cents). */
const reais = (value: number): number => Math.round(value * 100);

// --- Catalog -----------------------------------------------------------------

interface CategorySeed {
  name: string;
  color: string;
  type: TransactionType;
  subcategories?: string[];
}

const CATEGORY_SEEDS: CategorySeed[] = [
  {
    name: 'Mercado',
    color: '#1fba7a',
    type: EXPENSE,
    subcategories: ['Hortifruti', 'Carnes', 'Bebidas', 'Limpeza', 'Padaria'],
  },
  {
    name: 'Restaurantes',
    color: '#e8614a',
    type: EXPENSE,
    subcategories: ['Almoço', 'Jantar', 'Delivery', 'Café'],
  },
  {
    name: 'Transporte',
    color: '#4a8ee8',
    type: EXPENSE,
    subcategories: ['Combustível', 'App'],
  },
  {
    name: 'Lazer',
    color: '#a06ae0',
    type: EXPENSE,
    subcategories: ['Streaming', 'Passeios'],
  },
  {
    name: 'Moradia',
    color: '#e8a44a',
    type: EXPENSE,
    subcategories: ['Aluguel', 'Contas'],
  },
  {
    name: 'Saúde',
    color: '#5bc8e8',
    type: EXPENSE,
    subcategories: ['Academia', 'Farmácia', 'Consultas'],
  },
  { name: 'Salário', color: '#1fba7a', type: INCOME },
  { name: 'Freelance', color: '#d4a840', type: INCOME },
  { name: 'Investimentos', color: '#6ad0a8', type: INCOME },
];

/** Planned monthly budget per category, in reais. Replicated for every month. */
const BUDGET_PLANS: { categoryName: string; plannedReais: number }[] = [
  { categoryName: 'Moradia', plannedReais: 2800 },
  { categoryName: 'Mercado', plannedReais: 1000 },
  { categoryName: 'Transporte', plannedReais: 600 },
  { categoryName: 'Restaurantes', plannedReais: 400 },
  { categoryName: 'Lazer', plannedReais: 400 },
  { categoryName: 'Saúde', plannedReais: 300 },
];

// --- Grocery catalog ---------------------------------------------------------

const STORES = ['Atacadão', 'Carrefour', 'Pão de Açúcar', 'Assaí Atacadista'] as const;

interface GroceryProduct {
  normalizedName: string;
  rawDescription: string;
  brand?: string;
  size?: string;
  department: GroceryDepartment;
  unit: GroceryUnit;
  /** Base price per unit, in reais. Drifts up over time + per-receipt noise. */
  basePriceReais: number;
  /** Weighed items get a fractional kg quantity. */
  weighed?: boolean;
}

const PRODUCT_CATALOG: GroceryProduct[] = [
  {
    normalizedName: 'Arroz branco 5kg',
    rawDescription: 'ARROZ TIPO1 5KG',
    brand: 'Tio João',
    size: '5kg',
    department: GroceryDepartment.MERCEARIA,
    unit: GroceryUnit.UN,
    basePriceReais: 26,
  },
  {
    normalizedName: 'Feijão carioca 1kg',
    rawDescription: 'FEIJAO CARIOCA 1KG',
    brand: 'Camil',
    size: '1kg',
    department: GroceryDepartment.MERCEARIA,
    unit: GroceryUnit.UN,
    basePriceReais: 8.5,
  },
  {
    normalizedName: 'Café torrado 500g',
    rawDescription: 'CAFE TORR MOIDO 500G',
    brand: 'Pilão',
    size: '500g',
    department: GroceryDepartment.MERCEARIA,
    unit: GroceryUnit.UN,
    basePriceReais: 18,
  },
  {
    normalizedName: 'Açúcar refinado 1kg',
    rawDescription: 'ACUCAR REFINADO 1KG',
    brand: 'União',
    size: '1kg',
    department: GroceryDepartment.MERCEARIA,
    unit: GroceryUnit.UN,
    basePriceReais: 5,
  },
  {
    normalizedName: 'Óleo de soja 900ml',
    rawDescription: 'OLEO SOJA 900ML',
    brand: 'Liza',
    size: '900ml',
    department: GroceryDepartment.MERCEARIA,
    unit: GroceryUnit.UN,
    basePriceReais: 7.5,
  },
  {
    normalizedName: 'Leite integral 1L',
    rawDescription: 'LEITE INT 1L',
    brand: 'Italac',
    size: '1L',
    department: GroceryDepartment.LATICINIOS,
    unit: GroceryUnit.UN,
    basePriceReais: 5.5,
  },
  {
    normalizedName: 'Queijo mussarela',
    rawDescription: 'QUEIJO MUSSARELA KG',
    department: GroceryDepartment.LATICINIOS,
    unit: GroceryUnit.KG,
    basePriceReais: 44,
    weighed: true,
  },
  {
    normalizedName: 'Iogurte natural',
    rawDescription: 'IOGURTE NAT 170G',
    brand: 'Danone',
    size: '170g',
    department: GroceryDepartment.LATICINIOS,
    unit: GroceryUnit.UN,
    basePriceReais: 4.5,
  },
  {
    normalizedName: 'Banana prata',
    rawDescription: 'BANANA PRATA KG',
    department: GroceryDepartment.HORTIFRUTI,
    unit: GroceryUnit.KG,
    basePriceReais: 6,
    weighed: true,
  },
  {
    normalizedName: 'Tomate',
    rawDescription: 'TOMATE KG',
    department: GroceryDepartment.HORTIFRUTI,
    unit: GroceryUnit.KG,
    basePriceReais: 9,
    weighed: true,
  },
  {
    normalizedName: 'Maçã gala',
    rawDescription: 'MACA GALA KG',
    department: GroceryDepartment.HORTIFRUTI,
    unit: GroceryUnit.KG,
    basePriceReais: 10,
    weighed: true,
  },
  {
    normalizedName: 'Peito de frango',
    rawDescription: 'PEITO FRANGO KG',
    department: GroceryDepartment.AVES_PEIXES,
    unit: GroceryUnit.KG,
    basePriceReais: 17,
    weighed: true,
  },
  {
    normalizedName: 'Carne moída',
    rawDescription: 'PATINHO MOIDO KG',
    department: GroceryDepartment.CARNES,
    unit: GroceryUnit.KG,
    basePriceReais: 34,
    weighed: true,
  },
  {
    normalizedName: 'Pão de forma',
    rawDescription: 'PAO DE FORMA 500G',
    brand: 'Pullman',
    size: '500g',
    department: GroceryDepartment.PADARIA,
    unit: GroceryUnit.UN,
    basePriceReais: 9,
  },
  {
    normalizedName: 'Refrigerante 2L',
    rawDescription: 'REFRIGERANTE COLA 2L',
    brand: 'Coca-Cola',
    size: '2L',
    department: GroceryDepartment.BEBIDAS,
    unit: GroceryUnit.UN,
    basePriceReais: 10,
  },
  {
    normalizedName: 'Cerveja lata 350ml',
    rawDescription: 'CERVEJA LATA 350ML',
    brand: 'Heineken',
    size: '350ml',
    department: GroceryDepartment.BEBIDAS,
    unit: GroceryUnit.UN,
    basePriceReais: 4.5,
  },
  {
    normalizedName: 'Detergente 500ml',
    rawDescription: 'DETERGENTE NEUTRO 500ML',
    brand: 'Ypê',
    size: '500ml',
    department: GroceryDepartment.LIMPEZA,
    unit: GroceryUnit.UN,
    basePriceReais: 3,
  },
  {
    normalizedName: 'Sabão em pó 1kg',
    rawDescription: 'SABAO PO 1KG',
    brand: 'Omo',
    size: '1kg',
    department: GroceryDepartment.LIMPEZA,
    unit: GroceryUnit.UN,
    basePriceReais: 16,
  },
  {
    normalizedName: 'Papel higiênico 12un',
    rawDescription: 'PAPEL HIG 12 ROLOS',
    brand: 'Neve',
    size: '12un',
    department: GroceryDepartment.HIGIENE,
    unit: GroceryUnit.UN,
    basePriceReais: 22,
  },
  {
    normalizedName: 'Sorvete 2L',
    rawDescription: 'SORVETE CHOCOLATE 2L',
    brand: 'Kibon',
    size: '2L',
    department: GroceryDepartment.CONGELADOS,
    unit: GroceryUnit.UN,
    basePriceReais: 24,
  },
];

interface ItemSpec {
  normalizedName: string;
  rawDescription: string;
  brand?: string;
  size?: string;
  department: GroceryDepartment;
  unit: GroceryUnit;
  quantity: number;
  unitPriceMinorUnits: number;
  lineTotalMinorUnits: number;
}

interface ReceiptSpec {
  storeName: string;
  items: ItemSpec[];
  totalMinorUnits: number;
}

// --- Time helpers ------------------------------------------------------------

/** A date inside the month that is `ago` months before the current one. */
function monthDate(ago: number, day: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - ago, day, 12));
}

/** First day of the month `ago` months back, at 00:00:00 UTC (budget periodStart). */
function firstOfMonthUtc(ago: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - ago, 1));
}

// --- Transaction generation --------------------------------------------------

interface GeneratedTx {
  /** Months back from the current month (0 = current). Used to group budgets. */
  ago: number;
  date: Date;
  type: TransactionType;
  categoryName: string;
  subcategoryName?: string;
  amountMinorUnits: number;
  description: string;
  /** When present, this transaction also materializes a linked grocery receipt. */
  receipt?: ReceiptSpec;
}

const pick = <T>(items: readonly T[]): T => faker.helpers.arrayElement(items);
const between = (min: number, max: number): number => faker.number.int({ min, max });
const chance = (probability: number): boolean => faker.datatype.boolean({ probability });

/** A single shopping trip: 5-9 items with prices that drift up over time. */
function buildGroceryTrip(ago: number): ReceiptSpec {
  const monthsFromOldest = MONTHS - 1 - ago;
  const inflation = 1 + monthsFromOldest * 0.012;
  const products = faker.helpers.arrayElements(PRODUCT_CATALOG, between(5, 9));
  const items: ItemSpec[] = products.map((p) => {
    const quantity = p.weighed
      ? faker.number.float({ min: 0.3, max: 2.5, fractionDigits: 2 })
      : between(1, 4);
    const noise = faker.number.float({ min: 0.95, max: 1.08, fractionDigits: 3 });
    const unitPriceMinorUnits = reais(p.basePriceReais * inflation * noise);
    const lineTotalMinorUnits = Math.round(unitPriceMinorUnits * quantity);
    return {
      normalizedName: p.normalizedName,
      rawDescription: p.rawDescription,
      ...(p.brand !== undefined && { brand: p.brand }),
      ...(p.size !== undefined && { size: p.size }),
      department: p.department,
      unit: p.unit,
      quantity,
      unitPriceMinorUnits,
      lineTotalMinorUnits,
    };
  });
  const totalMinorUnits = items.reduce((acc, it) => acc + it.lineTotalMinorUnits, 0);
  return { storeName: pick(STORES), items, totalMinorUnits };
}

/**
 * Builds a realistic month of activity. Amounts and counts vary month to month
 * so the dashboard trend, category breakdown and budgets show real evolution:
 *  - a salary raise 3 months ago (income steps up),
 *  - a gentle lifestyle creep toward the present,
 *  - occasional freelance/investment income,
 *  - one-off events (a trip, a car repair) that dent specific months.
 */
function generateMonth(ago: number): GeneratedTx[] {
  const txs: GeneratedTx[] = [];
  const add = (tx: Omit<GeneratedTx, 'ago' | 'date'> & { day: number }): void => {
    const { day, ...rest } = tx;
    txs.push({ ...rest, ago, date: monthDate(ago, day) });
  };

  // 0 for the oldest month, growing toward the present.
  const monthsFromOldest = MONTHS - 1 - ago;
  const lifestyle = 1 + monthsFromOldest * 0.015;
  const scaled = (min: number, max: number): number => Math.round(between(min, max) * lifestyle);

  // --- Income ---
  const salary = ago <= 2 ? 8500 : 8000; // promotion 3 months ago
  add({
    type: INCOME,
    categoryName: 'Salário',
    amountMinorUnits: reais(salary),
    description: 'Salário mensal',
    day: 5,
  });
  if (ago === 1 || ago === 2 || ago === 4) {
    add({
      type: INCOME,
      categoryName: 'Freelance',
      amountMinorUnits: reais(between(1200, 3000)),
      description: pick(['Projeto freelance', 'Consultoria', 'Job extra']),
      day: between(8, 22),
    });
  }
  if (ago <= 3) {
    add({
      type: INCOME,
      categoryName: 'Investimentos',
      amountMinorUnits: reais(between(80, 280)),
      description: 'Rendimentos',
      day: 1,
    });
  }

  // --- Fixed expenses (every month) ---
  add({
    type: EXPENSE,
    categoryName: 'Moradia',
    subcategoryName: 'Aluguel',
    amountMinorUnits: reais(2200),
    description: 'Aluguel',
    day: 5,
  });
  add({
    type: EXPENSE,
    categoryName: 'Moradia',
    subcategoryName: 'Contas',
    amountMinorUnits: reais(between(280, 430)),
    description: pick(['Conta de luz', 'Internet + luz', 'Água e luz']),
    day: between(8, 15),
  });
  add({
    type: EXPENSE,
    categoryName: 'Lazer',
    subcategoryName: 'Streaming',
    amountMinorUnits: reais(between(39, 75)),
    description: 'Assinaturas',
    day: 10,
  });
  add({
    type: EXPENSE,
    categoryName: 'Saúde',
    subcategoryName: 'Academia',
    amountMinorUnits: reais(99),
    description: 'Academia',
    day: 7,
  });

  // --- Groceries: 3-4 receipts, each backing a linked Mercado transaction ---
  for (let i = 0; i < between(3, 4); i++) {
    const trip = buildGroceryTrip(ago);
    add({
      type: EXPENSE,
      categoryName: 'Mercado',
      amountMinorUnits: trip.totalMinorUnits,
      description: `Mercado - ${trip.storeName}`,
      day: between(1, 28),
      receipt: trip,
    });
  }

  // --- Dining out: 2-4 ---
  for (let i = 0; i < between(2, 4); i++) {
    add({
      type: EXPENSE,
      categoryName: 'Restaurantes',
      subcategoryName: pick(['Almoço', 'Jantar', 'Delivery', 'Café']),
      amountMinorUnits: reais(scaled(25, 130)),
      description: pick(['Restaurante', 'iFood', 'Lanche', 'Pizza', 'Café']),
      day: between(1, 28),
    });
  }

  // --- Transport ---
  add({
    type: EXPENSE,
    categoryName: 'Transporte',
    subcategoryName: 'Combustível',
    amountMinorUnits: reais(between(180, 340)),
    description: 'Combustível',
    day: between(3, 25),
  });
  for (let i = 0; i < between(2, 5); i++) {
    add({
      type: EXPENSE,
      categoryName: 'Transporte',
      subcategoryName: 'App',
      amountMinorUnits: reais(between(12, 55)),
      description: pick(['Uber', '99', 'Corrida']),
      day: between(1, 28),
    });
  }

  // --- Leisure outings: 0-2 ---
  for (let i = 0; i < between(0, 2); i++) {
    add({
      type: EXPENSE,
      categoryName: 'Lazer',
      subcategoryName: 'Passeios',
      amountMinorUnits: reais(between(40, 180)),
      description: pick(['Cinema', 'Bar', 'Show', 'Passeio']),
      day: between(1, 28),
    });
  }

  // --- Health (occasional) ---
  if (chance(0.6)) {
    add({
      type: EXPENSE,
      categoryName: 'Saúde',
      subcategoryName: 'Farmácia',
      amountMinorUnits: reais(between(30, 140)),
      description: 'Farmácia',
      day: between(1, 28),
    });
  }
  if (chance(0.25)) {
    add({
      type: EXPENSE,
      categoryName: 'Saúde',
      subcategoryName: 'Consultas',
      amountMinorUnits: reais(between(150, 400)),
      description: pick(['Consulta médica', 'Dentista', 'Exames']),
      day: between(1, 28),
    });
  }

  // --- One-off events that make specific months stand out ---
  if (ago === 3) {
    add({
      type: EXPENSE,
      categoryName: 'Lazer',
      subcategoryName: 'Passeios',
      amountMinorUnits: reais(2400),
      description: 'Viagem de fim de semana',
      day: 18,
    });
  }
  if (ago === 1) {
    add({
      type: EXPENSE,
      categoryName: 'Transporte',
      subcategoryName: 'Combustível',
      amountMinorUnits: reais(1250),
      description: 'Conserto do carro',
      day: 14,
    });
  }

  return txs;
}

// --- Persistence -------------------------------------------------------------

async function clearAllData(): Promise<void> {
  await db.delete(grocerySettings);
  await db.delete(groceryReceipts); // grocery_items removed via ON DELETE CASCADE
  await db.delete(budgets); // budget_scopes removed via ON DELETE CASCADE
  await db.delete(transactions);
  await db.delete(subcategories);
  await db.delete(categories);
  await db.delete(refreshTokens);
  await db.delete(users);
}

async function main(): Promise<void> {
  console.log('🧹 Clearing existing data...');
  await clearAllData();

  console.log(`👤 Creating user "${DEMO_EMAIL}" (password: "${DEMO_PASSWORD}")`);
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = User.create({ id: idGen.generate(), email: DEMO_EMAIL, passwordHash });
  user.clearDomainEvents();
  await userRepo.save(user);

  console.log('🏷️  Creating categories and subcategories...');
  const categoryByName = new Map<string, Category>();
  const subcategoryByName = new Map<string, Subcategory>();
  for (const seed of CATEGORY_SEEDS) {
    const cat = Category.create({
      id: idGen.generate(),
      userId: user.id,
      name: seed.name,
      color: seed.color,
      type: seed.type,
    });
    cat.clearDomainEvents();
    await categoryRepo.save(cat);
    categoryByName.set(seed.name, cat);

    for (const subName of seed.subcategories ?? []) {
      const sub = Subcategory.create({
        id: idGen.generate(),
        userId: user.id,
        categoryId: cat.id,
        name: subName,
      });
      sub.clearDomainEvents();
      await subcategoryRepo.save(sub);
      subcategoryByName.set(`${seed.name}>${subName}`, sub);
    }
  }

  console.log('🛒 Configuring grocery destination (Mercado)...');
  const mercado = categoryByName.get('Mercado');
  if (!mercado) throw new Error('Seed requires a "Mercado" category');
  await grocerySettingsRepo.save(
    GrocerySettings.create({ userId: user.id, categoryId: mercado.id, subcategoryId: null }),
  );

  console.log(`💸 Creating ${MONTHS} months of transactions...`);
  const allTxs: GeneratedTx[] = [];
  for (let ago = MONTHS - 1; ago >= 0; ago--) {
    allTxs.push(...generateMonth(ago));
  }

  for (const gen of allTxs) {
    const cat = categoryByName.get(gen.categoryName);
    if (!cat) throw new Error(`Seed references missing category: ${gen.categoryName}`);
    const sub = gen.subcategoryName
      ? subcategoryByName.get(`${gen.categoryName}>${gen.subcategoryName}`)
      : undefined;
    const tx = Transaction.create({
      id: idGen.generate(),
      userId: user.id,
      amount: Money.of(gen.amountMinorUnits, BRL),
      type: gen.type,
      categoryId: cat.id,
      subcategoryId: sub?.id ?? null,
      description: gen.description,
      date: gen.date,
    });
    tx.clearDomainEvents();
    await transactionRepo.save(tx);

    if (gen.receipt) {
      const receiptId = idGen.generate();
      const items = gen.receipt.items.map((it) =>
        GroceryItem.create({
          id: idGen.generate(),
          receiptId,
          rawDescription: it.rawDescription,
          normalizedName: it.normalizedName,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: Money.of(it.unitPriceMinorUnits, BRL),
          lineTotal: Money.of(it.lineTotalMinorUnits, BRL),
          brand: it.brand ?? null,
          code: null,
          department: it.department,
          size: it.size ?? null,
        }),
      );
      const receipt = GroceryReceipt.create({
        id: receiptId,
        userId: user.id,
        storeName: gen.receipt.storeName,
        purchaseDate: gen.date,
        total: Money.of(gen.amountMinorUnits, BRL),
        items,
      });
      receipt.linkTransaction(tx.id);
      await groceryReceiptRepo.save(receipt);
    }
  }

  console.log('🎯 Creating monthly budgets with denormalized spent...');
  let budgetCount = 0;
  for (let ago = MONTHS - 1; ago >= 0; ago--) {
    const periodStart = firstOfMonthUtc(ago);
    for (const plan of BUDGET_PLANS) {
      const cat = categoryByName.get(plan.categoryName);
      if (!cat) throw new Error(`Budget references missing category: ${plan.categoryName}`);

      const budget = Budget.create({
        id: idGen.generate(),
        userId: user.id,
        name: plan.categoryName,
        color: cat.color,
        scopes: [{ categoryId: cat.id, subcategoryId: null }],
        periodStart,
        planned: Money.of(reais(plan.plannedReais), BRL),
      });
      budget.clearDomainEvents();

      const spent = allTxs
        .filter((t) => t.ago === ago && t.type === EXPENSE && t.categoryName === plan.categoryName)
        .reduce((acc, t) => acc + t.amountMinorUnits, 0);
      budget.replaceSpent(Money.of(spent, BRL));

      await budgetRepo.save(budget);
      budgetCount++;
    }
  }

  const receiptTxs = allTxs.filter((t) => t.receipt);
  const itemCount = receiptTxs.reduce((acc, t) => acc + (t.receipt?.items.length ?? 0), 0);

  console.log('\n✅ Seed completed successfully');
  console.log(`   Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`   Months: ${MONTHS}`);
  console.log(`   Categories: ${categoryByName.size}`);
  console.log(`   Subcategories: ${subcategoryByName.size}`);
  console.log(`   Transactions: ${allTxs.length}`);
  console.log(`   Budgets: ${budgetCount}`);
  console.log(`   Grocery receipts: ${receiptTxs.length} (${itemCount} items)`);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
