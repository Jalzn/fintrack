import type { Currency } from '@/shared/domain';
import { Money } from '@/shared/domain';
import type { Transaction } from '../entities/transaction.entity';
import { TransactionType } from '../value-objects/transaction-type';

export interface BalanceSummary {
  balance: Money;
  income: Money;
  expense: Money;
}

export class BalanceCalculationService {
  calculate(transactions: Transaction[], currency: Currency): BalanceSummary {
    let income = Money.of(0, currency);
    let expense = Money.of(0, currency);

    for (const transaction of transactions) {
      if (transaction.type === TransactionType.INCOME) {
        income = income.add(transaction.amount);
      } else {
        expense = expense.add(transaction.amount);
      }
    }

    return { balance: income.subtract(expense), income, expense };
  }
}
