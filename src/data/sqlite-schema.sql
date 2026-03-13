-- DompetIQ Personal - SQLite Schema (implementasi saat ini)
-- Digunakan oleh SQLiteTransactionRepository.

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  monthly_limit INTEGER,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  amount INTEGER NOT NULL,
  category TEXT NOT NULL,
  note TEXT,
  source TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category);

CREATE TABLE IF NOT EXISTS insight_cache (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL,
  summary TEXT NOT NULL,
  generated_at TEXT NOT NULL
);

-- Tahap 2 (opsional)
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  cycle TEXT NOT NULL,
  next_date TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
