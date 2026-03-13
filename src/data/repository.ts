import { CreateTransactionInput, Transaction } from "../models/transaction";
import { openDatabaseAsync } from "expo-sqlite";
import { CreateRecurringExpenseInput, RecurringExpense } from "../models/recurringExpense";

export const DEFAULT_CATEGORY_NAMES = [
  "Makan",
  "Transport",
  "Belanja",
  "Tagihan",
  "Hiburan",
];

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeCategoryName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export interface TransactionRepository {
  list(): Promise<Transaction[]>;
  add(input: CreateTransactionInput): Promise<Transaction>;
  update(
    id: string,
    input: Partial<CreateTransactionInput>,
  ): Promise<Transaction | null>;
  remove(id: string): Promise<boolean>;
  clear(): Promise<void>;
  exportTransactionsJson(): Promise<string>;
  importTransactionsJson(rawJson: string): Promise<number>;
  getMonthlyBudgetLimit(defaultValue: number): Promise<number>;
  setMonthlyBudgetLimit(value: number): Promise<void>;
  listCategories(): Promise<CategoryItem[]>;
  addCategory(name: string): Promise<CategoryItem | string>;
  setCategoryMonthlyLimit(categoryName: string, limit: number | null): Promise<void>;
  exportTransactionsCsv?(): Promise<string>;
  
  // Recurring Expenses
  listRecurringExpenses(): Promise<RecurringExpense[]>;
  addRecurringExpense(input: CreateRecurringExpenseInput): Promise<RecurringExpense>;
  removeRecurringExpense(id: string): Promise<boolean>;
}

type DbInstance = Awaited<ReturnType<typeof openDatabaseAsync>>;

type TransactionRow = {
  id: string;
  amount: number;
  category: string;
  note: string | null;
  source: Transaction["source"];
  date: string;
  created_at: string;
  updated_at: string;
};

type CategoryRow = {
  id: string;
  name: string;
  monthly_limit: number | null;
  is_default: number;
};

export type CategoryItem = {
  id: string;
  name: string;
  monthlyLimit: number | null;
  isDefault: boolean;
};

function mapRowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    amount: row.amount,
    category: row.category,
    note: row.note ?? undefined,
    source: row.source,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToCategory(row: CategoryRow): CategoryItem {
  return {
    id: row.id,
    name: row.name,
    monthlyLimit: row.monthly_limit,
    isDefault: row.is_default === 1,
  };
}

/**
 * Repository MVP (sementara in-memory).
 *
 * Tahap berikutnya bisa ganti implementasi SQLite tanpa mengubah App/UI,
 * karena kontraknya tetap TransactionRepository.
 */
export class InMemoryTransactionRepository implements TransactionRepository {
  private items: Transaction[] = [
    {
      id: makeId(),
      amount: 25000,
      category: "Makan",
      note: "Nasi padang",
      source: "manual",
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  private monthlyBudgetLimit: number | null = null;
  private categories: CategoryItem[] = DEFAULT_CATEGORY_NAMES.map((name) => ({
    id: makeId(),
    name,
    monthlyLimit: null,
    isDefault: true,
  }));
  private recurringExpenses: RecurringExpense[] = [];

  async list(): Promise<Transaction[]> {
    return [...this.items];
  }

  async add(input: CreateTransactionInput): Promise<Transaction> {
    const now = new Date().toISOString();
    const normalizedCategory = normalizeCategoryName(input.category);
    await this.addCategory(normalizedCategory);
    const entity: Transaction = {
      id: makeId(),
      amount: input.amount,
      category: normalizedCategory,
      note: input.note,
      source: input.source ?? "manual",
      date: input.date ?? now,
      createdAt: now,
      updatedAt: now,
    };

    this.items.push(entity);
    return entity;
  }

  async update(
    id: string,
    input: Partial<CreateTransactionInput>,
  ): Promise<Transaction | null> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index < 0) return null;

    const previous = this.items[index];
    const updated: Transaction = {
      ...previous,
      amount: input.amount ?? previous.amount,
      category: input.category ?? previous.category,
      note: input.note ?? previous.note,
      source: input.source ?? previous.source,
      date: input.date ?? previous.date,
      updatedAt: new Date().toISOString(),
    };

    this.items[index] = updated;
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    const initialLength = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    return this.items.length !== initialLength;
  }

  async clear(): Promise<void> {
    this.items = [];
  }

  async exportTransactionsCsv(): Promise<string> {
    const headers = ['id', 'amount', 'category', 'note', 'source', 'date', 'created_at', 'updated_at'];
    const rows = this.items.map((item) => [
      item.id,
      item.amount,
      item.category,
      item.note ?? '',
      item.source,
      item.date,
      item.createdAt,
      item.updatedAt,
    ]);

    return [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
  }

  async exportTransactionsJson(): Promise<string> {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: {
        monthlyBudget: this.monthlyBudgetLimit,
      },
      categories: this.categories,
      transactions: this.items,
    });
  }

  async importTransactionsJson(jsonString: string): Promise<number> {
    const parsed = JSON.parse(jsonString) as unknown;
    const transactions = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' &&
          parsed !== null &&
          Array.isArray((parsed as { transactions?: unknown }).transactions)
        ? ((parsed as { transactions: unknown[] }).transactions ?? [])
        : null;

    if (!transactions) {
      throw new Error('Format backup tidak valid.');
    }

    const categories =
      typeof parsed === 'object' &&
      parsed !== null &&
      Array.isArray((parsed as { categories?: unknown }).categories)
        ? ((parsed as { categories: unknown[] }).categories ?? [])
        : [];

    const monthlyBudget =
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as { settings?: { monthlyBudget?: unknown } }).settings?.monthlyBudget !== 'undefined'
        ? Number((parsed as { settings?: { monthlyBudget?: unknown } }).settings?.monthlyBudget)
        : null;

    this.items = transactions
      .filter((row): row is Partial<Transaction> => typeof row === 'object' && row !== null)
      .map((row) => {
        const now = new Date().toISOString();
        return {
          id: String(row.id ?? makeId()),
          amount: Number(row.amount ?? 0),
          category: normalizeCategoryName(String(row.category ?? '')),
          note: row.note ? String(row.note) : undefined,
          source: row.source === 'ocr' || row.source === 'voice' || row.source === 'manual' ? row.source : 'manual',
          date: row.date ? String(row.date) : now,
          createdAt: row.createdAt ? String(row.createdAt) : now,
          updatedAt: row.updatedAt ? String(row.updatedAt) : now,
        };
      })
      .filter((item) => Number.isFinite(item.amount) && item.amount > 0 && Boolean(item.category));

    this.categories = DEFAULT_CATEGORY_NAMES.map((name) => ({
      id: makeId(),
      name,
      monthlyLimit: null,
      isDefault: true,
    }));

    for (const category of categories) {
      if (typeof category !== 'object' || category === null) continue;
      const candidate = category as Partial<CategoryItem>;
      const name = normalizeCategoryName(String(candidate.name ?? ''));
      if (!name) continue;

      const existingIndex = this.categories.findIndex((item) => item.name.toLowerCase() === name.toLowerCase());
      const nextCategory: CategoryItem = {
        id: typeof candidate.id === 'string' ? candidate.id : makeId(),
        name,
        monthlyLimit: typeof candidate.monthlyLimit === 'number' && Number.isFinite(candidate.monthlyLimit) ? candidate.monthlyLimit : null,
        isDefault: Boolean(candidate.isDefault),
      };

      if (existingIndex >= 0) {
        this.categories[existingIndex] = nextCategory;
      } else {
        this.categories.push(nextCategory);
      }
    }

    for (const item of this.items) {
      await this.addCategory(item.category);
    }

    this.monthlyBudgetLimit = Number.isFinite(monthlyBudget) && (monthlyBudget ?? 0) > 0 ? monthlyBudget : null;
    return this.items.length;
  }

  async getMonthlyBudgetLimit(defaultLimit: number): Promise<number> {
    return this.monthlyBudgetLimit ?? defaultLimit;
  }

  async setMonthlyBudgetLimit(limit: number): Promise<void> {
    this.monthlyBudgetLimit = limit;
  }

  async addCategory(name: string): Promise<CategoryItem> {
    const normalized = normalizeCategoryName(name);
    if (!normalized) {
      throw new Error("Nama kategori tidak boleh kosong.");
    }

    const existing = this.categories.find((item) => item.name.toLowerCase() === normalized.toLowerCase());
    if (existing) {
      return existing;
    }

    const category: CategoryItem = {
      id: makeId(),
      name: normalized,
      monthlyLimit: null,
      isDefault: false,
    };
    this.categories.push(category);
    return category;
  }

  async setCategoryMonthlyLimit(categoryName: string, limit: number | null): Promise<void> {
    const category = await this.addCategory(categoryName);
    this.categories = this.categories.map((item) =>
      item.id === category.id
        ? { ...item, monthlyLimit: limit }
        : item,
    );
  }

  async listCategories(): Promise<CategoryItem[]> {
    return [...this.categories];
  }

  async updateCategoryLimit(id: string, limit: number | null): Promise<void> {
    // mock save
  }

  async listRecurringExpenses(): Promise<RecurringExpense[]> {
    return [...this.recurringExpenses];
  }

  async addRecurringExpense(input: CreateRecurringExpenseInput): Promise<RecurringExpense> {
    const now = new Date().toISOString();
    const entity: RecurringExpense = {
      id: makeId(),
      ...input,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    this.recurringExpenses.push(entity);
    return entity;
  }

  async updateRecurringExpense(id: string, updates: Partial<CreateRecurringExpenseInput>): Promise<void> {
  }

  async removeRecurringExpense(id: string): Promise<boolean> {
    const initialLength = this.recurringExpenses.length;
    this.recurringExpenses = this.recurringExpenses.filter((item) => item.id !== id);
    return this.recurringExpenses.length !== initialLength;
  }
}

/**
 * Repository SQLite untuk penyimpanan persistent.
 */
export class SQLiteTransactionRepository implements TransactionRepository {
  private dbPromise: Promise<DbInstance> | null = null;
  private isSchemaReady = false;

  private async getDb(): Promise<DbInstance> {
    if (!this.dbPromise) {
      this.dbPromise = openDatabaseAsync("dompetiq-personal.db");
    }

    const db = await this.dbPromise;

    if (!this.isSchemaReady) {
      await db.execAsync(`
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
      `);

      const now = new Date().toISOString();
      for (const categoryName of DEFAULT_CATEGORY_NAMES) {
        await db.runAsync(
          "INSERT OR IGNORE INTO categories (id, name, monthly_limit, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
          [makeId(), categoryName, null, 1, now, now],
        );
      }

      this.isSchemaReady = true;
    }

    return db;
  }

  async list(): Promise<Transaction[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<TransactionRow>(
      "SELECT id, amount, category, note, source, date, created_at, updated_at FROM transactions ORDER BY date DESC",
    );

    return rows.map(mapRowToTransaction);
  }

  async add(input: CreateTransactionInput): Promise<Transaction> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const normalizedCategory = normalizeCategoryName(input.category);

    await this.addCategory(normalizedCategory);

    const entity: Transaction = {
      id: makeId(),
      amount: input.amount,
      category: normalizedCategory,
      note: input.note,
      source: input.source ?? "manual",
      date: input.date ?? now,
      createdAt: now,
      updatedAt: now,
    };

    await db.runAsync(
      "INSERT INTO transactions (id, amount, category, note, source, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        entity.id,
        entity.amount,
        entity.category,
        entity.note ?? null,
        entity.source,
        entity.date,
        entity.createdAt,
        entity.updatedAt,
      ],
    );

    return entity;
  }

  async update(
    id: string,
    input: Partial<CreateTransactionInput>,
  ): Promise<Transaction | null> {
    const db = await this.getDb();
    const existing = await db.getFirstAsync<TransactionRow>(
      "SELECT id, amount, category, note, source, date, created_at, updated_at FROM transactions WHERE id = ? LIMIT 1",
      [id],
    );

    if (!existing) return null;

    if (input.category && normalizeCategoryName(input.category)) {
      await this.addCategory(normalizeCategoryName(input.category));
    }

    const previous = mapRowToTransaction(existing);
    const updated: Transaction = {
      ...previous,
      amount: input.amount ?? previous.amount,
      category: input.category
        ? normalizeCategoryName(input.category)
        : previous.category,
      note: input.note ?? previous.note,
      source: input.source ?? previous.source,
      date: input.date ?? previous.date,
      updatedAt: new Date().toISOString(),
    };

    await db.runAsync(
      "UPDATE transactions SET amount = ?, category = ?, note = ?, source = ?, date = ?, updated_at = ? WHERE id = ?",
      [
        updated.amount,
        updated.category,
        updated.note ?? null,
        updated.source,
        updated.date,
        updated.updatedAt,
        id,
      ],
    );

    return updated;
  }

  async remove(id: string): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.runAsync("DELETE FROM transactions WHERE id = ?", [
      id,
    ]);
    return result.changes > 0;
  }

  async clear(): Promise<void> {
    const db = await this.getDb();
    await db.runAsync("DELETE FROM transactions");
  }

  async listCategories(): Promise<CategoryItem[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<CategoryRow>(
      "SELECT id, name, monthly_limit, is_default FROM categories ORDER BY is_default DESC, name ASC",
    );
    return rows.map(mapRowToCategory);
  }

  async addCategory(name: string): Promise<CategoryItem> {
    const db = await this.getDb();
    const normalized = normalizeCategoryName(name);
    if (!normalized) {
      throw new Error("Nama kategori tidak boleh kosong.");
    }

    const existing = await db.getFirstAsync<CategoryRow>(
      "SELECT id, name, monthly_limit, is_default FROM categories WHERE lower(name) = lower(?) LIMIT 1",
      [normalized],
    );

    if (existing) return mapRowToCategory(existing);

    const now = new Date().toISOString();
    await db.runAsync(
      "INSERT INTO categories (id, name, monthly_limit, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [makeId(), normalized, null, 0, now, now],
    );

    const inserted = await db.getFirstAsync<CategoryRow>(
      "SELECT id, name, monthly_limit, is_default FROM categories WHERE lower(name) = lower(?) LIMIT 1",
      [normalized],
    );

    if (!inserted) {
      throw new Error("Gagal menambahkan kategori.");
    }

    return mapRowToCategory(inserted);
  }

  async setCategoryMonthlyLimit(
    categoryName: string,
    limit: number | null,
  ): Promise<void> {
    const db = await this.getDb();
    const normalized = normalizeCategoryName(categoryName);
    if (!normalized) return;

    await this.addCategory(normalized);
    const now = new Date().toISOString();

    await db.runAsync(
      "UPDATE categories SET monthly_limit = ?, updated_at = ? WHERE lower(name) = lower(?)",
      [limit, now, normalized],
    );
  }

  async getMonthlyBudgetLimit(defaultValue: number): Promise<number> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = ? LIMIT 1",
      ["monthly_budget"],
    );

    if (!row?.value) return defaultValue;

    const parsed = Number(row.value);
    if (!Number.isFinite(parsed) || parsed <= 0) return defaultValue;
    return parsed;
  }

  async setMonthlyBudgetLimit(value: number): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)",
      ["monthly_budget", String(value), now],
    );
  }

  // --- Tahap 2: Recurring Expenses CRUD ---
  
  async listRecurringExpenses(): Promise<RecurringExpense[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<any>(
      "SELECT id, name, amount, cycle, next_date, active, created_at, updated_at FROM recurring_expenses ORDER BY next_date ASC"
    );
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      amount: row.amount,
      cycle: row.cycle,
      nextDate: row.next_date,
      active: row.active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async addRecurringExpense(input: CreateRecurringExpenseInput): Promise<RecurringExpense> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const entity: RecurringExpense = {
      id: makeId(),
      name: input.name,
      amount: input.amount,
      cycle: input.cycle,
      nextDate: input.nextDate,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await db.runAsync(
      "INSERT INTO recurring_expenses (id, name, amount, cycle, next_date, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [entity.id, entity.name, entity.amount, entity.cycle, entity.nextDate, 1, entity.createdAt, entity.updatedAt]
    );

    return entity;
  }

  async removeRecurringExpense(id: string): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.runAsync("DELETE FROM recurring_expenses WHERE id = ?", [id]);
    return result.changes > 0;
  }

  async exportTransactionsCsv(): Promise<string> {
    const items = await this.list();
    const headers = ['id', 'amount', 'category', 'note', 'source', 'date', 'created_at', 'updated_at'];
    const rows = items.map((item) => [
      item.id,
      item.amount,
      item.category,
      item.note ?? '',
      item.source,
      item.date,
      item.createdAt,
      item.updatedAt,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  async exportTransactionsJson(): Promise<string> {
    const [items, categories, monthlyBudget] = await Promise.all([
      this.list(),
      this.listCategories(),
      this.getMonthlyBudgetLimit(3_000_000),
    ]);

    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: {
          monthlyBudget,
        },
        categories,
        transactions: items,
      },
      null,
      2,
    );
  }

  async importTransactionsJson(rawJson: string): Promise<number> {
    const parsed = JSON.parse(rawJson) as unknown;

    const parsedTransactions = Array.isArray(parsed)
      ? parsed
      : typeof parsed === "object" &&
          parsed !== null &&
          Array.isArray((parsed as { transactions?: unknown }).transactions)
        ? ((parsed as { transactions: unknown[] }).transactions ?? [])
        : null;

    if (!parsedTransactions) {
      throw new Error(
        "Format backup tidak valid. Harus array transaksi atau object backup.",
      );
    }

    const parsedMonthlyBudget =
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as { settings?: { monthlyBudget?: unknown } }).settings
        ?.monthlyBudget !== "undefined"
        ? Number(
            (parsed as { settings?: { monthlyBudget?: unknown } }).settings
              ?.monthlyBudget,
          )
        : null;

    const parsedCategories =
      typeof parsed === "object" &&
      parsed !== null &&
      Array.isArray((parsed as { categories?: unknown }).categories)
        ? ((parsed as { categories: unknown[] }).categories ?? [])
        : [];

    const db = await this.getDb();

    await db.withTransactionAsync(async () => {
      await db.runAsync("DELETE FROM transactions");

      if (
        Number.isFinite(parsedMonthlyBudget) &&
        (parsedMonthlyBudget ?? 0) > 0
      ) {
        await db.runAsync(
          "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)",
          [
            "monthly_budget",
            String(parsedMonthlyBudget),
            new Date().toISOString(),
          ],
        );
      }

      for (const rawCategory of parsedCategories) {
        if (typeof rawCategory !== "object" || rawCategory === null) continue;

        const cat = rawCategory as Partial<CategoryItem>;
        const normalizedName = normalizeCategoryName(String(cat.name ?? ""));
        if (!normalizedName) continue;

        const now = new Date().toISOString();
        const monthlyLimit = Number(cat.monthlyLimit);

        await db.runAsync(
          "INSERT OR IGNORE INTO categories (id, name, monthly_limit, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
          [
            makeId(),
            normalizedName,
            Number.isFinite(monthlyLimit) && monthlyLimit > 0
              ? monthlyLimit
              : null,
            cat.isDefault ? 1 : 0,
            now,
            now,
          ],
        );
      }

      for (const row of parsedTransactions) {
        if (typeof row !== "object" || row === null) continue;

        const candidate = row as Partial<Transaction>;
        const amount = Number(candidate.amount);
        const category = normalizeCategoryName(
          String(candidate.category ?? ""),
        );

        if (!Number.isFinite(amount) || amount <= 0 || !category) continue;

        const now = new Date().toISOString();

        await db.runAsync(
          "INSERT OR IGNORE INTO categories (id, name, monthly_limit, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
          [makeId(), category, null, 0, now, now],
        );

        const entity: Transaction = {
          id: String(candidate.id ?? makeId()),
          amount,
          category,
          note: candidate.note ? String(candidate.note) : undefined,
          source:
            candidate.source === "ocr" ||
            candidate.source === "voice" ||
            candidate.source === "manual"
              ? candidate.source
              : "manual",
          date: candidate.date ? String(candidate.date) : now,
          createdAt: candidate.createdAt ? String(candidate.createdAt) : now,
          updatedAt: candidate.updatedAt ? String(candidate.updatedAt) : now,
        };

        await db.runAsync(
          "INSERT INTO transactions (id, amount, category, note, source, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            entity.id,
            entity.amount,
            entity.category,
            entity.note ?? null,
            entity.source,
            entity.date,
            entity.createdAt,
            entity.updatedAt,
          ],
        );
      }
    });

    const latestItems = await this.list();
    return latestItems.length;
  }
}
