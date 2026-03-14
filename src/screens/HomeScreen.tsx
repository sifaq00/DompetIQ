import React from 'react';
import { ScrollView, View, Text, Pressable, TextInput, Alert } from 'react-native';
import { TrendingDown, TrendingUp, ArrowDownLeft, ArrowUpRight, PlusCircle, Camera, Mic, CalendarClock } from 'lucide-react-native';
import { formatIDR } from '../utils/formatters';
import { Transaction } from '../models/transaction';
import { CategoryItem } from '../data/repository';
import { aiService } from '../services/aiService';
import { RecurringExpense } from '../models/recurringExpense';
import { CameraModal } from '../components/CameraModal';
import { VoiceModal } from '../components/VoiceModal';
import { BudgetOverview } from '../services/budgetService';
import { AppTab } from '../hooks/useAppLogic';
import { getLocalMonthKey } from '../utils/date';

interface HomeScreenProps {
  budget: BudgetOverview;
  todaySpend: number;
  transactions: Transaction[];
  monthKey: string;
  amountText: string;
  setAmountText: (val: string) => void;
  categories: CategoryItem[];
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  customCategoryText: string;
  setCustomCategoryText: (val: string) => void;
  note: string;
  setNote: (val: string) => void;
  editingTransactionId: string | null;
  categoryLimitsInput: Record<string, string>;
  setCategoryLimitsInput: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  categorySpendMap: Record<string, number>;
  monthlyBudgetInput: string;
  setMonthlyBudgetInput: (val: string) => void;
  backupExportText: string;
  backupExportCsvText: string;
  backupImportText: string;
  setBackupImportText: (val: string) => void;
  upcomingBills: RecurringExpense[];
  handlers: {
    handleAddCustomCategory: () => void;
    handleSubmitTransaction: () => void;
    handleSaveCategoryLimit: (name: string) => void;
    handleSaveMonthlyBudget: () => void;
    handleExportBackup: () => void;
    handleExportCsv: () => void;
    handleImportBackup: () => void;
    resetQuickForm: () => void;
    setActiveTab: (tab: AppTab) => void;
  };
}

export function HomeScreen({
  budget,
  todaySpend,
  transactions,
  monthKey,
  amountText,
  setAmountText,
  categories,
  selectedCategory,
  setSelectedCategory,
  customCategoryText,
  setCustomCategoryText,
  note,
  setNote,
  editingTransactionId,
  categoryLimitsInput,
  setCategoryLimitsInput,
  categorySpendMap,
  monthlyBudgetInput,
  setMonthlyBudgetInput,
  backupExportText,
  backupExportCsvText,
  backupImportText,
  setBackupImportText,
  upcomingBills,
  handlers,
}: HomeScreenProps) {
  const [showCamera, setShowCamera] = React.useState(false);
  const [showVoice, setShowVoice] = React.useState(false);

  const handleCameraCapture = async (uri: string) => {
    try {
      const result = await aiService.parseReceiptFromImage(uri);
      if (result.amount) setAmountText(String(result.amount));
      if (result.category) setSelectedCategory(result.category);
      if (result.note) setNote(result.note || '');

      if (!result.amount) {
        Alert.alert(
          'Scan Sebagian Berhasil',
          'Teks struk berhasil dibaca, tapi nominal total belum ketemu. Cek dan isi nominal secara manual dulu ya.',
        );
        return;
      }

      Alert.alert('Scan Berhasil', 'Nominal dan informasi struk berhasil dimasukkan ke form.');
    } catch (error) {
      Alert.alert('Scan gagal', error instanceof Error ? error.message : 'Terjadi kesalahan saat membaca struk.');
    }
  };

  const handleVoiceTranscript = async (path: string) => {
    try {
      const result = await aiService.parseTransactionFromVoice(path);
      if (result.amount) setAmountText(String(result.amount));
      if (result.category) setSelectedCategory(result.category);
      if (result.note) setNote(result.note || '');
      Alert.alert('Suara Terdeteksi', 'Transaksi berhasil dimasukkan ke form.');
    } catch (error) {
      Alert.alert('Input suara belum tersedia', error instanceof Error ? error.message : 'Fitur ini masih dalam pengembangan.');
    }
  };

  return (
    <ScrollView contentContainerClassName="px-5 pb-[100px] pt-4 gap-4" showsVerticalScrollIndicator={false}>
      <CameraModal
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />
      <VoiceModal
        visible={showVoice}
        onClose={() => setShowVoice(false)}
        onTranscript={handleVoiceTranscript}
      />

      <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 z-20">
        <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider text-center font-sans">Sisa Budget Bulan Ini</Text>
        <Text className="text-slate-900 text-3xl font-extrabold text-center mt-1.5 font-sans">{formatIDR(budget.remaining)}</Text>

        <View className="flex-row justify-between items-center mt-5 pt-5 border-t border-slate-100">
          <View className="flex-row items-center gap-3">
            <View className="bg-green-50 p-2.5 rounded-xl">
              <TrendingDown size={18} color="#16a34a" />
            </View>
            <View>
              <Text className="text-slate-400 text-[10px] font-semibold font-sans">Batas Budget</Text>
              <Text className="text-slate-700 font-bold font-sans">{formatIDR(budget.limit)}</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <View>
              <Text className="text-slate-400 text-[10px] font-semibold text-right font-sans">Terpakai</Text>
              <Text className="text-slate-700 font-bold text-right font-sans">{formatIDR(budget.used)}</Text>
            </View>
            <View className="bg-red-50 p-2.5 rounded-xl">
              <TrendingUp size={18} color="#dc2626" />
            </View>
          </View>
        </View>

        <View className="h-1.5 w-full bg-slate-100 rounded-full mt-5 overflow-hidden">
          <View
            className={`h-full rounded-full ${budget.percentUsed > 90 ? 'bg-red-500' : 'bg-brand-500'}`}
            style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
          />
        </View>
      </View>

      <View className="flex-row gap-3 mt-1">
        <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 items-center">
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest font-sans">Hari Ini</Text>
          <Text className="text-brand-600 text-lg font-extrabold mt-1 font-sans">{formatIDR(todaySpend)}</Text>
        </View>
        <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 items-center">
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest font-sans">Transaksi</Text>
          <Text className="text-slate-800 text-lg font-extrabold mt-1 font-sans">{transactions.filter((t: Transaction) => getLocalMonthKey(t.date) === monthKey).length}</Text>
        </View>
      </View>

      {upcomingBills.length > 0 && (
        <View className="bg-brand-50 border border-brand-100 rounded-3xl p-5 mb-1 flex-row items-center gap-4 shadow-sm">
          <View className="bg-brand-600 p-3 rounded-full">
            <CalendarClock size={20} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="text-brand-900 font-extrabold text-sm font-sans tracking-tight">Tagihan Mendatang</Text>
            <Text className="text-brand-700 text-xs font-sans mt-0.5" numberOfLines={1}>
              {upcomingBills.length} tagihan rutin jatuh tempo segera.
            </Text>
          </View>
          <Pressable
            className="bg-brand-600 px-4 py-2 rounded-xl active:bg-brand-700"
            onPress={() => handlers.setActiveTab('Rutin')}
          >
            <Text className="text-white font-bold text-xs font-sans">Cek</Text>
          </Pressable>
        </View>
      )}

      <View className="flex-row gap-3 mt-1">
        <Pressable
          className="flex-1 bg-white py-4 rounded-2xl items-center justify-center gap-2 border border-slate-100 shadow-sm"
          onPress={() => Alert.alert('Info', 'Formulir Pemasukan akan hadir di tahap selanjutnya.')}
        >
          <View className="bg-brand-50 p-2.5 rounded-full">
            <ArrowDownLeft size={22} color="#1f57e7" />
          </View>
          <Text className="text-slate-700 font-bold text-xs font-sans">Pemasukan</Text>
        </Pressable>

        <Pressable className="flex-1 bg-white py-4 rounded-2xl items-center justify-center gap-2 border border-slate-100 shadow-sm">
          <View className="bg-red-50 p-2.5 rounded-full">
            <ArrowUpRight size={22} color="#dc2626" />
          </View>
          <Text className="text-slate-700 font-bold text-xs font-sans">Pengeluaran</Text>
        </Pressable>
      </View>

      <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 gap-5 mt-1">
        <View className="flex-row items-center gap-2">
          <PlusCircle size={22} color="#1f57e7" />
          <Text className="text-lg font-extrabold text-slate-800 font-sans tracking-tight">Catat Cepat</Text>
        </View>

        <View>
          <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1 font-sans">Nominal</Text>
          <TextInput
            placeholder="Cth: 35000"
            keyboardType="numeric"
            value={amountText}
            onChangeText={setAmountText}
            className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 text-xl font-extrabold font-sans focus:border-brand-500 focus:bg-brand-50"
          />
        </View>

        <View>
          <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1 font-sans">Kategori</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2" contentContainerStyle={{ paddingRight: 20 }}>
            {categories.map((categoryItem: CategoryItem) => (
              <Pressable
                key={categoryItem.id}
                onPress={() => setSelectedCategory(categoryItem.name)}
                className={`px-4 py-2.5 rounded-xl border mr-2 transition-colors ${
                  selectedCategory === categoryItem.name
                    ? 'bg-brand-600 border-brand-600'
                    : 'bg-white border-slate-200 active:bg-slate-50'
                }`}
              >
                <Text className={`font-semibold font-sans text-sm ${selectedCategory === categoryItem.name ? 'text-white' : 'text-slate-600'}`}>
                  {categoryItem.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View className="flex-row gap-3 items-center mt-1">
          <TextInput
            placeholder="Tambah kategori custom"
            value={customCategoryText}
            onChangeText={setCustomCategoryText}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-sans font-medium focus:border-brand-500 focus:bg-brand-50"
            onSubmitEditing={handlers.handleAddCustomCategory}
          />
          <Pressable className="bg-brand-600 py-3.5 px-6 rounded-xl flex-row gap-2 items-center" onPress={handlers.handleAddCustomCategory}>
            <Text className="text-white font-bold font-sans">Simpan</Text>
          </Pressable>
        </View>

        <TextInput
          placeholder="Catatan (opsional)"
          value={note}
          onChangeText={setNote}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 mt-1 font-sans font-medium focus:border-brand-500 focus:bg-brand-50"
        />

        <Pressable className="bg-brand-600 py-3.5 rounded-xl items-center mt-2 shadow-sm" onPress={handlers.handleSubmitTransaction}>
          <Text className="text-white font-bold text-base font-sans">
            {editingTransactionId ? 'Simpan Perubahan' : '+ Simpan Pengeluaran'}
          </Text>
        </Pressable>

        <View className="flex-row gap-2 mt-1">
          <Pressable className="flex-1 flex-row justify-center items-center gap-2 bg-slate-50 border border-slate-200 py-3 rounded-lg active:bg-brand-50" onPress={() => setShowCamera(true)}>
            <Camera size={16} color="#64748b" />
            <Text className="text-slate-600 font-medium font-sans">Scan Struk</Text>
          </Pressable>
          <Pressable className="flex-1 flex-row justify-center items-center gap-2 bg-slate-50 border border-slate-200 py-3 rounded-lg active:bg-brand-50" onPress={() => setShowVoice(true)}>
            <Mic size={16} color="#64748b" />
            <Text className="text-slate-600 font-medium font-sans">Input Suara</Text>
          </Pressable>
        </View>

        {editingTransactionId ? (
          <Pressable className="bg-slate-100 py-3 rounded-lg items-center mt-1" onPress={handlers.resetQuickForm}>
            <Text className="text-slate-600 font-bold font-sans">Batal Edit</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 gap-3">
        <Text className="text-lg font-bold text-slate-900 font-sans">Budget Bulanan</Text>
        <Text className="text-sm text-slate-500 font-sans">Atur batas total pengeluaran per bulan.</Text>
        <View className="flex-row gap-2 items-center">
          <TextInput
            placeholder="Contoh: 3000000"
            keyboardType="numeric"
            value={monthlyBudgetInput}
            onChangeText={setMonthlyBudgetInput}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 text-sm font-sans focus:border-brand-500"
          />
          <Pressable className="bg-brand-50 px-4 py-2.5 rounded-lg" onPress={handlers.handleSaveMonthlyBudget}>
            <Text className="text-brand-600 font-semibold text-sm font-sans">Simpan</Text>
          </Pressable>
        </View>
      </View>

      <View className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 gap-3">
        <Text className="text-lg font-bold text-slate-900 font-sans">Budget Per Kategori</Text>
        <Text className="text-sm text-slate-500 font-sans">Opsional: isi limit untuk kategori yang ingin dikontrol lebih ketat.</Text>

        {categories.map((category: CategoryItem) => {
          const spent = categorySpendMap[category.name] ?? 0;
          const limit = category.monthlyLimit;
          const overBudget = typeof limit === 'number' && limit > 0 && spent > limit;

          return (
            <View key={`limit-${category.name}`} className="bg-slate-50 rounded-xl p-4 border border-slate-100 gap-2 mb-2">
              <Text className="font-bold text-slate-800 font-sans">{category.name}</Text>
              <Text className="text-xs text-slate-500 font-sans">
                Terpakai: {formatIDR(spent)} {typeof limit === 'number' && limit > 0 ? `/ Limit ${formatIDR(limit)}` : ''}
              </Text>
              {overBudget ? <Text className="text-xs font-bold text-red-600 font-sans">Melebihi limit</Text> : null}
              <View className="flex-row gap-2 mt-1 items-center">
                <TextInput
                  placeholder="Set limit"
                  keyboardType="numeric"
                  value={categoryLimitsInput[category.name] ?? ''}
                  onChangeText={(value) => setCategoryLimitsInput((prev: Record<string, string>) => ({ ...prev, [category.name]: value }))}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 text-sm font-sans focus:border-brand-500"
                />
                <Pressable className="bg-brand-50 px-4 py-2.5 rounded-lg" onPress={() => handlers.handleSaveCategoryLimit(category.name)}>
                  <Text className="text-brand-600 font-semibold text-sm font-sans">Simpan</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      <View className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 gap-3">
        <Text className="text-lg font-bold text-slate-900 font-sans">Backup & Restore</Text>
        <Pressable className="bg-brand-50 py-3 rounded-lg items-center" onPress={handlers.handleExportBackup}>
          <Text className="text-brand-600 font-semibold font-sans">Backup JSON</Text>
        </Pressable>
        <TextInput
          value={backupExportText}
          editable={false}
          multiline
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 min-h-[80px]"
        />

        <Pressable className="bg-brand-50 py-3 rounded-lg items-center mt-2" onPress={handlers.handleExportCsv}>
          <Text className="text-brand-600 font-semibold font-sans">Export CSV</Text>
        </Pressable>
        <TextInput
          value={backupExportCsvText}
          editable={false}
          multiline
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 min-h-[80px]"
        />
        <TextInput
          value={backupImportText}
          onChangeText={setBackupImportText}
          multiline
          placeholder="Paste JSON di sini"
          className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs min-h-[80px]"
        />
        <Pressable className="bg-brand-600 py-3.5 rounded-xl items-center shadow-sm" onPress={handlers.handleImportBackup}>
          <Text className="text-white font-bold font-sans">Restore</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
