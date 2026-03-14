import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { CalendarClock, PlusCircle, X } from 'lucide-react-native';
import { CreateRecurringExpenseInput, RecurringCycle, RecurringExpense } from '../models/recurringExpense';
import { formatIDR, formatShortDate } from '../utils/formatters';
import { formatLocalDate } from '../utils/date';

const CYCLE_OPTIONS: Array<{ label: string; value: RecurringCycle }> = [
  { label: 'Harian', value: 'daily' },
  { label: 'Mingguan', value: 'weekly' },
  { label: 'Bulanan', value: 'monthly' },
  { label: 'Tahunan', value: 'yearly' },
];

interface RutinScreenProps {
  recurringExpenses: RecurringExpense[];
  onAdd: (input: CreateRecurringExpenseInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function RutinScreen({ recurringExpenses, onAdd, onDelete }: RutinScreenProps) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState<RecurringCycle>('monthly');
  const [nextDate, setNextDate] = useState(formatLocalDate());

  const handleSave = async () => {
    const parsedAmount = Number(amount.replace(/[^\d]/g, ''));
    const cleanedName = name.trim();
    const normalizedDate = nextDate.trim();

    if (!cleanedName || !parsedAmount) {
      Alert.alert('Eror', 'Nama dan nominal harus diisi.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate) || Number.isNaN(new Date(normalizedDate).getTime())) {
      Alert.alert('Tanggal belum valid', 'Gunakan format tanggal YYYY-MM-DD yang valid.');
      return;
    }

    await onAdd({ name: cleanedName, amount: parsedAmount, cycle, nextDate: normalizedDate });
    setShowModal(false);
    setName('');
    setAmount('');
    setCycle('monthly');
    setNextDate(formatLocalDate());
  };

  return (
    <View className="flex-1 bg-slate-50">
      <FlatList
        data={recurringExpenses}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-5 pb-[100px]"
        ListHeaderComponent={
          <View className="mb-5">
            <Text className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">Pengeluaran Rutin</Text>
            <Text className="text-slate-500 font-sans font-medium text-sm mt-1">
              Atur langganan bulananmu agar terekap otomatis.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="bg-white border border-slate-100 rounded-3xl p-8 items-center justify-center shadow-sm">
            <View className="bg-brand-50 p-4 rounded-full mb-4">
              <CalendarClock size={32} color="#1f57e7" />
            </View>
            <Text className="text-slate-800 font-bold font-sans text-center text-lg">Belum Ada Rutinitas</Text>
            <Text className="text-center text-slate-500 font-sans font-medium text-sm mt-2">
              Langganan Spotify, Netflix, atau Tagihan Listrik bisa dicatat di sini.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-white p-5 rounded-3xl border border-slate-100 flex-row justify-between items-center shadow-sm mb-4">
            <View className="flex-1 mr-3">
              <Text className="text-base font-bold text-slate-800 font-sans tracking-tight">{item.name}</Text>
              <Text className="text-xs text-brand-600 mt-1 font-sans font-bold">Siklus: {item.cycle} • Aktif</Text>
              <Text className="text-xs text-slate-500 mt-1 font-sans font-medium border-t border-slate-100 pt-1">
                Jatuh Tempo: {formatShortDate(item.nextDate)}
              </Text>
              <Pressable className="mt-2 self-start" onPress={() => onDelete(item.id)}>
                <Text className="text-red-500 text-xs font-bold">Hapus</Text>
              </Pressable>
            </View>
            <Text className="text-lg font-extrabold text-slate-900 font-sans">{formatIDR(item.amount)}</Text>
          </View>
        )}
      />
      <Pressable
        className="absolute bottom-[100px] right-6 bg-brand-600 w-14 h-14 rounded-full items-center justify-center"
        style={{
          shadowColor: '#1741b5',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 5,
        }}
        onPress={() => setShowModal(true)}
      >
        <PlusCircle size={28} color="#ffffff" />
      </Pressable>

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[40px] p-6 pb-12 gap-5 shadow-2xl">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xl font-extrabold text-slate-800 font-sans">Tambah Rutinitas</Text>
              <Pressable onPress={() => setShowModal(false)} className="bg-slate-100 p-2 rounded-full">
                <X size={20} color="#64748b" />
              </Pressable>
            </View>

            <View>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1 font-sans">Nama Pengeluaran</Text>
              <TextInput
                placeholder="Cth: Spotify Premium"
                value={name}
                onChangeText={setName}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold font-sans"
              />
            </View>

            <View>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1 font-sans">Nominal</Text>
              <TextInput
                placeholder="Cth: 54990"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 text-xl font-extrabold font-sans"
              />
            </View>

            <View>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1 font-sans">Siklus</Text>
              <View className="flex-row flex-wrap gap-2">
                {CYCLE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setCycle(option.value)}
                    className={`px-4 py-3 rounded-2xl border ${
                      cycle === option.value ? 'bg-brand-600 border-brand-600' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text className={`font-bold font-sans ${cycle === option.value ? 'text-white' : 'text-slate-700'}`}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1 font-sans">Tgl Berikutnya (YYYY-MM-DD)</Text>
              <TextInput
                value={nextDate}
                onChangeText={setNextDate}
                autoCapitalize="none"
                className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold font-sans"
              />
            </View>

            <Pressable className="bg-brand-600 py-4 rounded-2xl items-center shadow-lg mt-2" onPress={handleSave}>
              <Text className="text-white font-bold text-base font-sans">Simpan Rutinitas</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
