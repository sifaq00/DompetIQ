import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';

interface HeaderProps {
  name: string;
}

export function Header({ name }: HeaderProps) {
  return (
    <View className="bg-brand-600 px-5 py-4 rounded-b-2xl shadow-sm z-10 flex-row justify-between items-center">
      <View>
        <Text className="text-brand-100 text-xs font-medium font-sans">Selamat datang,</Text>
        <Text className="text-white text-xl font-bold tracking-tight mt-0.5 font-sans">{name} 👋</Text>
      </View>
      <Pressable className="bg-white/20 p-2 rounded-full">
        <Bell size={18} color="#ffffff" />
      </Pressable>
    </View>
  );
}
