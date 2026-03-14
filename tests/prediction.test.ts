import test from 'node:test';
import assert from 'node:assert/strict';
import { predictionService } from '../src/services/predictionService';
import type { Transaction } from '../src/models/transaction';
import { formatLocalMonthKey } from '../src/utils/date';

function makeTransaction(amount: number): Transaction {
  const now = new Date().toISOString();
  return {
    id: `tx-${amount}`,
    amount,
    category: 'Makan',
    source: 'manual',
    date: now,
    createdAt: now,
    updatedAt: now,
  };
}

test('prediction marks over-budget trajectory as danger', () => {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();
  const monthlyLimit = 3_000_000;
  const totalSpent = Math.ceil((monthlyLimit * currentDay) / daysInMonth) + 50_000;

  const result = predictionService.predictEndOfMonthExpense(
    [makeTransaction(totalSpent)],
    monthlyLimit,
    formatLocalMonthKey(today),
  );

  assert.equal(result.status, 'danger');
  assert.ok(result.estimatedTotal > monthlyLimit);
});

test('prediction marks near-limit trajectory as warning', () => {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();
  const monthlyLimit = 3_000_000;
  const targetEstimate = Math.floor(monthlyLimit * 0.85);
  const totalSpent = Math.ceil((targetEstimate * currentDay) / daysInMonth);

  const result = predictionService.predictEndOfMonthExpense(
    [makeTransaction(totalSpent)],
    monthlyLimit,
    formatLocalMonthKey(today),
  );

  assert.equal(result.status, 'warning');
  assert.ok(result.estimatedTotal <= monthlyLimit);
});
