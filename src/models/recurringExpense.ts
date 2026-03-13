export type RecurringCycle = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type RecurringExpense = {
  id: string;
  name: string;
  amount: number;
  cycle: RecurringCycle;
  nextDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateRecurringExpenseInput = {
  name: string;
  amount: number;
  cycle: RecurringCycle;
  nextDate: string;
};
