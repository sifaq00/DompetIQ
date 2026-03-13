import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { PieChart, TrendingUp, TrendingDown } from 'lucide-react-native';
import { formatIDR } from '../utils/formatters';
import { Transaction } from '../models/transaction';
import { PredictionResult } from '../services/predictionService';

interface InsightScreenProps {
  transactions: Transaction[];
  topCategories: Array<{ category: string; amount: number }>;
  weeklyInsight: string;
  monthlyLimit: number;
  monthKey: string;
  prediction: PredictionResult;
}

export function InsightScreen({
  transactions,
  topCategories,
  weeklyInsight,
  monthlyLimit,
  monthKey,
  prediction,
}: InsightScreenProps) {
  let predictionBg = 'bg-brand-50 border-brand-100';
  let predictionIcon = <TrendingUp size={24} color="#1f57e7" />;
  let predictionTitleColor = 'text-brand-700';

  if (prediction.status === 'danger') {
    predictionBg = 'bg-red-50 border-red-100';
    predictionIcon = <TrendingDown size={24} color="#dc2626" />;
    predictionTitleColor = 'text-red-700';
  } else if (prediction.status === 'warning') {
    predictionBg = 'bg-amber-50 border-amber-100';
    predictionIcon = <TrendingUp size={24} color="#d97706" />;
    predictionTitleColor = 'text-amber-700';
  }

  const maxCategoryAmount = topCategories.length > 0 ? topCategories[0].amount : 1;

  return (
    <ScrollView contentContainerClassName="p-5 pb-[100px] gap-5" showsVerticalScrollIndicator={false}>
      <View className="mb-1">
        <Text className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight">Insight Keuangan</Text>
        <Text className="text-slate-500 font-sans font-medium mt-1">Analisis cerdas pengeluaran bulan ini</Text>
      </View>

      <View className={`rounded-3xl p-5 shadow-sm border ${predictionBg}`}>
        <View className="flex-row items-center gap-4 mb-3">
          <View className="bg-white/80 p-3 rounded-2xl shadow-sm">
            {predictionIcon}
          </View>
          <View className="flex-1">
            <Text className={`text-xs font-bold uppercase tracking-wider font-sans opacity-70 ${predictionTitleColor}`}>Proyeksi Akhir Bulan</Text>
            <Text className={`text-xl font-extrabold font-sans mt-0.5 ${predictionTitleColor}`}>
              {formatIDR(prediction.estimatedTotal)}
            </Text>
          </View>
        </View>
        <Text className={`text-sm font-medium font-sans ${predictionTitleColor} leading-relaxed opacity-90`}>
          {prediction.message}
        </Text>
      </View>

      <View className="bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-800">
        <View className="flex-row items-center gap-2 mb-3">
          <PieChart size={20} color="#60a5fa" />
          <Text className="text-base font-bold text-white font-sans tracking-tight">Ringkasan Mingguan</Text>
        </View>
        <Text className="text-sm leading-relaxed text-slate-300 font-sans font-medium">{weeklyInsight}</Text>
      </View>

      <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <Text className="text-lg font-extrabold text-slate-900 font-sans tracking-tight mb-5">Pengeluaran Terbesar</Text>
        {topCategories.length === 0 ? (
          <View className="items-center py-4">
            <Text className="text-slate-400 font-sans font-medium text-sm">Belum ada data kategori bulan ini.</Text>
          </View>
        ) : (
          <View className="gap-5">
            {topCategories.map((item, index) => {
              const percentage = Math.min((item.amount / maxCategoryAmount) * 100, 100);
              return (
                <View key={item.category}>
                  <View className="flex-row justify-between items-end mb-2.5">
                    <Text className="font-bold text-slate-700 font-sans text-sm">{index + 1}. {item.category}</Text>
                    <Text className="font-extrabold text-slate-900 font-sans">{formatIDR(item.amount)}</Text>
                  </View>
                  <View className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                    <View className="h-full bg-brand-500 rounded-full" style={{ width: `${percentage}%` }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
