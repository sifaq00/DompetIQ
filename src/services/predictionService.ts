// Placeholder for Tahap 2 Prediction capabilities

import type { Transaction } from '../models/transaction';
import { getLocalMonthKey } from '../utils/date';

export type PredictionResult = {
  estimatedTotal: number;
  status: 'safe' | 'warning' | 'danger';
  message: string;
};

export class PredictionService {
  /**
   * Stub predict end-of-month expense for Tahap 2
   */
  predictEndOfMonthExpense(transactions: Transaction[], monthlyLimit: number, currentMonthKey: string): PredictionResult {
    // Basic stub logic
    const currentMonthTx = transactions.filter((t) => getLocalMonthKey(t.date) === currentMonthKey);
    const totalSpent = currentMonthTx.reduce((acc, t) => acc + t.amount, 0);

    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentDay = today.getDate();

    if (currentDay === 0) {
        return { estimatedTotal: 0, status: 'safe', message: 'Belum ada data cukup.' };
    }

    // Simple historical average
    const dailyAverage = totalSpent / currentDay;
    const estimatedTotal = Math.round(dailyAverage * daysInMonth);

    let status: 'safe' | 'warning' | 'danger' = 'safe';
    let message = 'Pengeluaran Anda masih dalam batas aman.';

    if (estimatedTotal > monthlyLimit) {
      status = 'danger';
      message = 'Perhatian! Jika pola berlanjut, Anda akan melebihi batas budget bulan ini.';
    } else if (estimatedTotal > monthlyLimit * 0.8) {
      status = 'warning';
      message = 'Hati-hati, pengeluaran Anda mendekati batas budget bulan ini.';
    }

    return { estimatedTotal, status, message };
  }
}

export const predictionService = new PredictionService();
