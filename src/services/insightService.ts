import type { Transaction } from '../models/transaction';
import { parseStoredDate } from '../utils/date';

function getWeekRange(now = new Date()): { start: Date; end: Date } {
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - diffToMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function toIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildWeeklySummary(transactions: Transaction[]): string {
  const { start, end } = getWeekRange();

  const weeklyTransactions = transactions.filter((item) => {
    const date = parseStoredDate(item.date);
    return date >= start && date <= end;
  });

  if (weeklyTransactions.length === 0) {
    return 'Minggu ini belum ada pengeluaran. Bagus, tetap disiplin sebelum belanja.';
  }

  const total = weeklyTransactions.reduce((acc, item) => acc + item.amount, 0);

  const categoryMap = new Map<string, number>();
  for (const item of weeklyTransactions) {
    categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + item.amount);
  }

  const [topCategory = 'Lainnya', topAmount = 0] = [...categoryMap.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0] ?? ['Lainnya', 0];

  return `Minggu ini kamu mencatat ${weeklyTransactions.length} transaksi dengan total ${toIDR(
    total,
  )}. Kategori terbesar: ${topCategory} (${toIDR(topAmount)}).`;
}
