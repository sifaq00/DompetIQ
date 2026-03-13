export type TransactionSource = 'manual' | 'ocr' | 'voice';

export type TransactionCategory = string;

export type Transaction = {
  id: string;
  amount: number;
  category: TransactionCategory;
  note?: string;
  source: TransactionSource;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateTransactionInput = {
  amount: number;
  category: TransactionCategory;
  note?: string;
  source?: TransactionSource;
  date?: string;
};
