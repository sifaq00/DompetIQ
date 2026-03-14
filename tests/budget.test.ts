import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMonthlyBudgetOverview, getCategorySpendMap, getTopCategorySpend } from '../src/services/budgetService';
import type { Transaction } from '../src/models/transaction';

function makeTransaction(overrides: Partial<Transaction>): Transaction {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? 'tx',
    amount: overrides.amount ?? 0,
    category: overrides.category ?? 'Makan',
    source: overrides.source ?? 'manual',
    date: overrides.date ?? now,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    note: overrides.note,
  };
}

test('monthly budget overview sums only transactions from requested month', () => {
  const transactions = [
    makeTransaction({ id: '1', amount: 100_000, category: 'Makan', date: '2026-03-14T12:00:00.000Z' }),
    makeTransaction({ id: '2', amount: 50_000, category: 'Transport', date: '2026-03-15T12:00:00.000Z' }),
    makeTransaction({ id: '3', amount: 75_000, category: 'Belanja', date: '2026-02-28T12:00:00.000Z' }),
  ];

  const overview = buildMonthlyBudgetOverview(transactions, 300_000, '2026-03');

  assert.equal(overview.used, 150_000);
  assert.equal(overview.remaining, 150_000);
  assert.equal(overview.percentUsed, 50);
});

test('top categories and spend map aggregate by category within a month', () => {
  const transactions = [
    makeTransaction({ id: '1', amount: 100_000, category: 'Makan', date: '2026-03-14T12:00:00.000Z' }),
    makeTransaction({ id: '2', amount: 90_000, category: 'Transport', date: '2026-03-15T12:00:00.000Z' }),
    makeTransaction({ id: '3', amount: 25_000, category: 'Makan', date: '2026-03-16T12:00:00.000Z' }),
    makeTransaction({ id: '4', amount: 10_000, category: 'Transport', date: '2026-02-16T12:00:00.000Z' }),
  ];

  const top = getTopCategorySpend(transactions, 2, '2026-03');
  const spendMap = getCategorySpendMap(transactions, '2026-03');

  assert.deepEqual(top, [
    { category: 'Makan', amount: 125_000 },
    { category: 'Transport', amount: 90_000 },
  ]);
  assert.deepEqual(spendMap, {
    Makan: 125_000,
    Transport: 90_000,
  });
});
