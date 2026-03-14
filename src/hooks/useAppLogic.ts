import { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert, Keyboard } from 'react-native';
import { Transaction, CreateTransactionInput } from '../models/transaction';
import { CreateRecurringExpenseInput, RecurringExpense } from '../models/recurringExpense';
import { CategoryItem, DEFAULT_CATEGORY_NAMES, TransactionRepository } from '../data/repository';
import { buildMonthlyBudgetOverview, getTodaySpend, getTopCategorySpend, getCategorySpendMap } from '../services/budgetService';
import { buildWeeklySummary } from '../services/insightService';
import { aiService } from '../services/aiService';
import { predictionService } from '../services/predictionService';
import { addDays, formatLocalMonthKey, getLocalMonthKey, parseStoredDate, startOfLocalDay } from '../utils/date';

export interface UseAppLogicProps {
  repository: TransactionRepository;
  defaultMonthlyBudget: number;
}

export type AppTab = 'Beranda' | 'Riwayat' | 'Insight' | 'Rutin';

export function useAppLogic({ repository, defaultMonthlyBudget }: UseAppLogicProps) {
  const [activeTab, setActiveTab] = useState<AppTab>('Beranda');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [amountText, setAmountText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Makan');
  const [note, _setNote] = useState('');

  const setNote = (value: string) => {
    _setNote(value);
    const suggestion = aiService.suggestCategory(value);
    if (suggestion) {
      setSelectedCategory(suggestion);
    }
  };
  const [historyFilter, setHistoryFilter] = useState('');
  const [historyMonthFilter, setHistoryMonthFilter] = useState<string>(
    formatLocalMonthKey()
  );
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoryLimitsInput, setCategoryLimitsInput] = useState<Record<string, string>>({});
  const [monthlyBudgetLimit, setMonthlyBudgetLimit] = useState(defaultMonthlyBudget);
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState(String(defaultMonthlyBudget));
  const [backupExportText, setBackupExportText] = useState('');
  const [backupExportCsvText, setBackupExportCsvText] = useState('');
  const [backupImportText, setBackupImportText] = useState('');

  const refreshTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const [items, budgetLimit, categoryItems, recurringItems] = await Promise.all([
        repository.list(),
        repository.getMonthlyBudgetLimit(defaultMonthlyBudget),
        repository.listCategories(),
        repository.listRecurringExpenses(),
      ]);

      setTransactions(items);
      setMonthlyBudgetLimit(budgetLimit);
      setMonthlyBudgetInput(String(budgetLimit));
      setRecurringExpenses(recurringItems);

      const categoriesFromData = Array.from(new Set<string>(items.map((item: Transaction) => item.category))).filter((name: string) => {
        return !categoryItems.some((cat: CategoryItem) => cat.name.toLowerCase() === name.toLowerCase());
      });

      for (const name of categoriesFromData) {
        await repository.addCategory(name);
      }

      const finalCategories = await repository.listCategories();
      setCategories(finalCategories);

      const nextCategoryLimitsInput: Record<string, string> = {};
      for (const category of finalCategories) {
        nextCategoryLimitsInput[category.name] =
          typeof category.monthlyLimit === 'number' && Number.isFinite(category.monthlyLimit)
            ? String(category.monthlyLimit)
            : '';
      }
      setCategoryLimitsInput(nextCategoryLimitsInput);
    } catch (error) {
      Alert.alert('Gagal memuat data', error instanceof Error ? error.message : 'Terjadi kesalahan saat membuka data.');
    } finally {
      setIsLoading(false);
    }
  }, [repository, defaultMonthlyBudget]);

  useEffect(() => {
    void refreshTransactions();
  }, [refreshTransactions]);

  const monthKey = formatLocalMonthKey();
  const budget = useMemo(() => buildMonthlyBudgetOverview(transactions, monthlyBudgetLimit, monthKey), [transactions, monthKey, monthlyBudgetLimit]);
  const todaySpend = useMemo(() => getTodaySpend(transactions), [transactions]);
  const topCategories = useMemo(() => getTopCategorySpend(transactions, 3, monthKey), [transactions, monthKey]);
  const categorySpendMap = useMemo(() => getCategorySpendMap(transactions, monthKey), [transactions, monthKey]);
  const weeklyInsight = useMemo(() => buildWeeklySummary(transactions), [transactions]);

  const prediction = useMemo(() => 
    predictionService.predictEndOfMonthExpense(transactions, monthlyBudgetLimit, monthKey), 
    [transactions, monthlyBudgetLimit, monthKey]
  );

  const upcomingBills = useMemo(() => {
    const today = startOfLocalDay();
    const threeDaysLater = addDays(today, 3);

    return recurringExpenses.filter(expense => {
      const dueDate = startOfLocalDay(parseStoredDate(expense.nextDate));
      return dueDate >= today && dueDate <= threeDaysLater && expense.active;
    });
  }, [recurringExpenses]);

  const sortedTransactions = useMemo(() => [...transactions].sort(
    (a, b) => parseStoredDate(b.date).getTime() - parseStoredDate(a.date).getTime(),
  ), [transactions]);

  const filteredTransactions = useMemo(() => {
    let result = sortedTransactions;
    if (historyMonthFilter && historyMonthFilter !== 'ALL') {
      result = result.filter((item) => getLocalMonthKey(item.date) === historyMonthFilter);
    }
    const keyword = historyFilter.trim().toLowerCase();
    if (keyword) {
      result = result.filter((item) => {
        const haystack = `${item.category} ${item.note ?? ''} ${item.amount}`.toLowerCase();
        return haystack.includes(keyword);
      });
    }
    return result;
  }, [sortedTransactions, historyFilter, historyMonthFilter]);

  const resetQuickForm = () => {
    setAmountText('');
    setNote('');
    setSelectedCategory(DEFAULT_CATEGORY_NAMES[0] ?? 'Makan');
    setEditingTransactionId(null);
  };

  const handleSaveMonthlyBudget = async () => {
    const parsed = Number(monthlyBudgetInput.replace(/[^\d]/g, ''));
    if (!parsed || parsed <= 0) {
      Alert.alert('Budget belum valid', 'Masukkan nominal budget bulanan yang benar.');
      return;
    }
    await repository.setMonthlyBudgetLimit(parsed);
    setMonthlyBudgetLimit(parsed);
    setMonthlyBudgetInput(String(parsed));
    Alert.alert('Berhasil', 'Budget bulanan berhasil disimpan.');
  };

  const handleExportBackup = async () => {
    const result = await repository.exportTransactionsJson();
    setBackupExportText(result);
    Alert.alert('Backup JSON siap', 'JSON backup sudah dibuat.');
  };

  const handleExportCsv = async () => {
    if (repository.exportTransactionsCsv) {
      const result = await repository.exportTransactionsCsv();
      setBackupExportCsvText(result);
      Alert.alert('Backup CSV siap', 'CSV backup sudah dibuat.');
    } else {
      Alert.alert('Gagal', 'Fungsi Export CSV belum tersedia.');
    }
  };

  const handleImportBackup = async () => {
    try {
      const restoredCount = await repository.importTransactionsJson(backupImportText);
      await refreshTransactions();
      setBackupImportText('');
      Alert.alert('Restore sukses', `${restoredCount} transaksi berhasil dipulihkan.`);
    } catch (error) {
      Alert.alert('Restore gagal', error instanceof Error ? error.message : 'Format JSON tidak valid.');
    }
  };

  const handleSubmitTransaction = async () => {
    const parsedAmount = Number(amountText.replace(/[^\d]/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Input belum valid', 'Masukkan nominal pengeluaran yang benar.');
      return;
    }
    const payload: CreateTransactionInput = {
      amount: parsedAmount,
      category: selectedCategory,
      note: note.trim() || undefined,
      source: 'manual',
      date: new Date().toISOString(),
    };
    if (editingTransactionId) {
      await repository.update(editingTransactionId, payload);
      setEditingTransactionId(null);
    } else {
      await repository.add(payload);
    }
    await refreshTransactions();
    resetQuickForm();
    setActiveTab('Beranda');
  };

  const handleAddCustomCategory = () => {
    const cleaned = customCategoryText.trim();
    if (!cleaned) return;
    const allCategories = categories.map((item) => item.name);
    const alreadyExists = allCategories.some((item) => item.toLowerCase() === cleaned.toLowerCase());
    if (alreadyExists) {
      setSelectedCategory(allCategories.find((item) => item.toLowerCase() === cleaned.toLowerCase()) ?? cleaned);
      setCustomCategoryText('');
      Keyboard.dismiss();
      return;
    }
    void (async () => {
      await repository.addCategory(cleaned);
      await refreshTransactions();
      setSelectedCategory(cleaned);
      setCustomCategoryText('');
      Keyboard.dismiss();
    })();
  };

  const handleSaveCategoryLimit = (categoryName: string) => {
    void (async () => {
      const raw = categoryLimitsInput[categoryName] ?? '';
      const normalizedRaw = raw.replace(/[^\d]/g, '');
      const parsed = normalizedRaw ? Number(normalizedRaw) : 0;
      if (normalizedRaw && (!Number.isFinite(parsed) || parsed <= 0)) {
        Alert.alert('Limit belum valid', 'Masukkan angka yang benar.');
        return;
      }
      await repository.setCategoryMonthlyLimit(categoryName, parsed > 0 ? parsed : null);
      await refreshTransactions();
      Alert.alert('Tersimpan', `Limit ${categoryName} diperbarui.`);
    })();
  };

  const handleDeleteTransaction = (id: string) => {
    Alert.alert('Hapus transaksi', 'Yakin ingin menghapus?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await repository.remove(id);
          await refreshTransactions();
        },
      },
    ]);
  };

  const handleQuickEditTransaction = (item: Transaction) => {
    setEditingTransactionId(item.id);
    setAmountText(String(item.amount));
    setSelectedCategory(item.category);
    setNote(item.note ?? '');
    setActiveTab('Beranda');
  };

  const handleAddRecurringExpense = async (input: CreateRecurringExpenseInput) => {
    await repository.addRecurringExpense(input);
    await refreshTransactions();
    Alert.alert('Berhasil', 'Pengeluaran rutin berhasil ditambahkan.');
  };

  const handleDeleteRecurringExpense = async (id: string) => {
    Alert.alert('Hapus Rutinitas', 'Yakin ingin menghapus pengeluaran rutin ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await repository.removeRecurringExpense(id);
          await refreshTransactions();
        },
      },
    ]);
  };

  return {
    activeTab, setActiveTab,
    transactions, recurringExpenses, isLoading,
    amountText, setAmountText,
    selectedCategory, setSelectedCategory,
    note, setNote,
    historyFilter, setHistoryFilter,
    historyMonthFilter, setHistoryMonthFilter,
    editingTransactionId,
    customCategoryText, setCustomCategoryText,
    categories,
    categoryLimitsInput, setCategoryLimitsInput,
    monthlyBudgetLimit,
    monthlyBudgetInput, setMonthlyBudgetInput,
    backupExportText,
    backupExportCsvText,
    backupImportText, setBackupImportText,
    budget, todaySpend, topCategories, categorySpendMap, weeklyInsight,
    filteredTransactions, monthKey,
    handleSaveMonthlyBudget, handleExportBackup, handleExportCsv, handleImportBackup,
    handleSubmitTransaction, resetQuickForm, handleAddCustomCategory,
    handleSaveCategoryLimit, handleDeleteTransaction, handleQuickEditTransaction,
    handleAddRecurringExpense, handleDeleteRecurringExpense,
    upcomingBills, prediction
  };
}
