import './global.css';
import { StatusBar } from 'expo-status-bar';
import { 
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import React from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  View,
  Platform,
} from 'react-native';
import {
  Wallet,
  History,
  PieChart,
  CalendarClock,
} from 'lucide-react-native';

import { SQLiteTransactionRepository, InMemoryTransactionRepository } from './src/data/repository';
import { AppTab, useAppLogic } from './src/hooks/useAppLogic';
import { Header } from './src/components/Header';
import { AnimatedTabButton } from './src/components/AnimatedTabButton';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { HomeScreen } from './src/screens/HomeScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { InsightScreen } from './src/screens/InsightScreen';
import { RutinScreen } from './src/screens/RutinScreen';

const DEFAULT_MONTHLY_BUDGET = 3_000_000;
const repository = Platform.OS === 'web' 
  ? new InMemoryTransactionRepository() 
  : new SQLiteTransactionRepository();

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1f57e7" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const logic = useAppLogic({ repository, defaultMonthlyBudget: DEFAULT_MONTHLY_BUDGET });

  const renderActiveTab = () => {
    if (logic.isLoading) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1f57e7" />
        </View>
      );
    }

    switch (logic.activeTab) {
      case 'Beranda':
        return (
          <HomeScreen 
            budget={logic.budget}
            todaySpend={logic.todaySpend}
            transactions={logic.transactions}
            monthKey={logic.monthKey}
            amountText={logic.amountText}
            setAmountText={logic.setAmountText}
            categories={logic.categories}
            selectedCategory={logic.selectedCategory}
            setSelectedCategory={logic.setSelectedCategory}
            customCategoryText={logic.customCategoryText}
            setCustomCategoryText={logic.setCustomCategoryText}
            note={logic.note}
            setNote={logic.setNote}
            editingTransactionId={logic.editingTransactionId}
            categoryLimitsInput={logic.categoryLimitsInput}
            setCategoryLimitsInput={logic.setCategoryLimitsInput}
            categorySpendMap={logic.categorySpendMap}
            backupExportText={logic.backupExportText}
            backupExportCsvText={logic.backupExportCsvText}
            backupImportText={logic.backupImportText}
            setBackupImportText={logic.setBackupImportText}
            upcomingBills={logic.upcomingBills}
            handlers={{
              handleAddCustomCategory: logic.handleAddCustomCategory,
              handleSubmitTransaction: logic.handleSubmitTransaction,
              handleSaveCategoryLimit: logic.handleSaveCategoryLimit,
              handleExportBackup: logic.handleExportBackup,
              handleExportCsv: logic.handleExportCsv,
              handleImportBackup: logic.handleImportBackup,
              resetQuickForm: logic.resetQuickForm,
              setActiveTab: logic.setActiveTab,
            }}
          />
        );
      case 'Riwayat':
        return (
          <HistoryScreen 
            transactions={logic.filteredTransactions}
            historyFilter={logic.historyFilter}
            setHistoryFilter={logic.setHistoryFilter}
            historyMonthFilter={logic.historyMonthFilter}
            setHistoryMonthFilter={logic.setHistoryMonthFilter}
            actions={{
              onDelete: logic.handleDeleteTransaction,
              onQuickEdit: logic.handleQuickEditTransaction
            }}
          />
        );
      case 'Insight':
        return (
          <InsightScreen 
            transactions={logic.transactions}
            topCategories={logic.topCategories}
            weeklyInsight={logic.weeklyInsight}
            monthlyLimit={logic.monthlyBudgetLimit}
            monthKey={logic.monthKey}
            prediction={logic.prediction}
          />
        );
      case 'Rutin':
        return (
          <RutinScreen 
            recurringExpenses={logic.recurringExpenses} 
            onAdd={logic.handleAddRecurringExpense}
            onDelete={logic.handleDeleteRecurringExpense}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="light" backgroundColor="#1741b5" />
      <Header name="Sifaq" />
      <View className="flex-1">
        {renderActiveTab()}
      </View>
      <View className="flex-row items-end justify-around bg-white pb-6 pt-2 px-2 shadow-sm z-50">
        {(['Beranda', 'Riwayat', 'Insight', 'Rutin'] as const).map((tab) => {
          let Icon;
          if (tab === 'Beranda') Icon = Wallet;
          else if (tab === 'Riwayat') Icon = History;
          else if (tab === 'Insight') Icon = PieChart;
          else if (tab === 'Rutin') Icon = CalendarClock;

          return (
            <AnimatedTabButton
              key={tab}
              tab={tab}
              Icon={Icon}
              isActive={logic.activeTab === tab}
              onPress={() => logic.setActiveTab(tab as AppTab)}
            />
          );
        })}
      </View>
    </SafeAreaView>
  );
}
