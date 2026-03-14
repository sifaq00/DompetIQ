import React from 'react';
import { FlatList, View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import { Transaction } from '../models/transaction';
import { formatIDR, formatShortDate } from '../utils/formatters';
import { formatLocalMonthKey } from '../utils/date';

interface HistoryScreenProps {
  transactions: Transaction[];
  historyFilter: string;
  setHistoryFilter: (val: string) => void;
  historyMonthFilter: string;
  setHistoryMonthFilter: (val: string) => void;
  actions: {
    onDelete: (id: string) => void;
    onQuickEdit: (item: Transaction) => void;
  };
}

export function HistoryScreen({
  transactions,
  historyFilter,
  setHistoryFilter,
  historyMonthFilter,
  setHistoryMonthFilter,
  actions,
}: HistoryScreenProps) {
  const monthOptions = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = formatLocalMonthKey(d);
    const label = new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(d);
    return { value, label };
  });

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id}
      contentContainerClassName="p-5 pb-[100px]"
      ListHeaderComponent={
        <View className="mb-5 gap-3">
          <View>
            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest font-sans mb-2 ml-1">Periode</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row" contentContainerStyle={{ paddingRight: 20 }}>
              <Pressable
                onPress={() => setHistoryMonthFilter('ALL')}
                className={`px-4 py-2 rounded-xl border mr-2 transition-colors ${
                  historyMonthFilter === 'ALL' ? 'bg-brand-600 border-brand-600' : 'bg-white border-slate-200'
                }`}
              >
                <Text className={`font-semibold font-sans text-xs ${historyMonthFilter === 'ALL' ? 'text-white' : 'text-slate-600'}`}>Semua Waktu</Text>
              </Pressable>
              {monthOptions.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setHistoryMonthFilter(opt.value)}
                  className={`px-4 py-2 rounded-xl border mr-2 transition-colors ${
                    historyMonthFilter === opt.value ? 'bg-brand-600 border-brand-600' : 'bg-white border-slate-200'
                  }`}
                >
                  <Text className={`font-semibold font-sans text-xs ${historyMonthFilter === opt.value ? 'text-white' : 'text-slate-600'}`}>{opt.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <TextInput
            placeholder="Cari transaksi..."
            value={historyFilter}
            onChangeText={setHistoryFilter}
            className="bg-white border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 shadow-sm font-semibold font-sans focus:border-brand-500"
          />
        </View>
      }
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center p-8 bg-slate-50 mt-10">
          <Text className="text-center text-slate-500 font-medium font-sans">Belum ada transaksi di periode ini.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View className="bg-white p-5 rounded-3xl border border-slate-100 flex-row justify-between items-center shadow-sm mb-4">
          <View className="flex-1 mr-3">
            <Text className="text-base font-bold text-slate-800 font-sans tracking-tight">{item.category}</Text>
            <Text className="text-xs text-slate-500 mt-1 font-sans font-medium">
              {formatShortDate(item.date)} {item.note ? `- ${item.note}` : ''}
            </Text>
            <View className="flex-row gap-2 mt-2.5">
              <Pressable className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200" onPress={() => actions.onQuickEdit(item)}>
                <Text className="text-slate-600 font-semibold text-xs font-sans">Edit</Text>
              </Pressable>
              <Pressable className="bg-red-50 px-3 py-1.5 rounded-lg border border-red-100" onPress={() => actions.onDelete(item.id)}>
                <Text className="text-red-600 font-semibold text-xs font-sans">Hapus</Text>
              </Pressable>
            </View>
          </View>
          <Text className="text-lg font-extrabold text-slate-900 font-sans">{formatIDR(item.amount)}</Text>
        </View>
      )}
    />
  );
}
