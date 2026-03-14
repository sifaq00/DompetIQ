import type { Transaction } from '../models/transaction';
import { formatLocalDate, getLocalDateKey, getLocalMonthKey } from '../utils/date';

export type BudgetOverview = {
  limit: number;
  used: number;
  remaining: number;
  percentUsed: number;
};

export function buildMonthlyBudgetOverview(
  transactions: Transaction[],
  monthlyLimit: number,
  monthKey: string,
): BudgetOverview {
  const used = transactions
    .filter((item) => getLocalMonthKey(item.date) === monthKey)
    .reduce((acc, item) => acc + item.amount, 0);

  const remaining = monthlyLimit - used;
  const rawPercent = monthlyLimit <= 0 ? 0 : (used / monthlyLimit) * 100;

  return {
    limit: monthlyLimit,
    used,
    remaining,
    percentUsed: Math.max(0, Math.round(rawPercent)),
  };
}

export function getTodaySpend(transactions: Transaction[]): number {
  const todayKey = formatLocalDate();

  return transactions
    .filter((item) => getLocalDateKey(item.date) === todayKey)
    .reduce((acc, item) => acc + item.amount, 0);
}

export function getTopCategorySpend(
  transactions: Transaction[],
  limit: number,
  monthKey: string,
): Array<{ category: string; amount: number }> {
  const bucket = new Map<string, number>();

  for (const item of transactions) {
    if (getLocalMonthKey(item.date) !== monthKey) continue;

    const previous = bucket.get(item.category) ?? 0;
    bucket.set(item.category, previous + item.amount);
  }

  return [...bucket.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export function getCategorySpendMap(
  transactions: Transaction[],
  monthKey: string,
): Record<string, number> {
  const output: Record<string, number> = {};

  for (const item of transactions) {
    if (getLocalMonthKey(item.date) !== monthKey) continue;
    output[item.category] = (output[item.category] ?? 0) + item.amount;
  }

  return output;
}
