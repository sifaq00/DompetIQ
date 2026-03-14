import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Mic, X, Waves } from 'lucide-react-native';

interface VoiceModalProps {
  visible: boolean;
  onClose: () => void;
  onTranscript: (audioPath: string) => void;
}

export function VoiceModal({ visible, onClose, onTranscript }: VoiceModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    if (visible) return;

    setIsRecording(false);
    setIsProcessing(false);
    setSeconds(0);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      timeoutRef.current = setTimeout(() => {
        setIsProcessing(false);
        timeoutRef.current = null;
        onTranscript('voice-input-placeholder');
        onClose();
      }, 2000);
      return;
    }

    setIsRecording(true);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black/80 justify-center items-center p-6">
        <View className="bg-white w-full rounded-[40px] p-8 items-center shadow-2xl">
          <View className="absolute top-6 right-6">
            <Pressable onPress={onClose} className="bg-slate-100 p-2 rounded-full">
              <X size={20} color="#64748b" />
            </Pressable>
          </View>

          <Text className="text-xl font-extrabold text-slate-800 font-sans mb-2">Input Suara</Text>
          <Text className="text-slate-500 font-sans text-center mb-10 px-4">
            {isProcessing ? 'Menerjemahkan suara...' : 'Ucapkan nominal dan kategori. Contoh: "Makan siang 50 ribu"'}
          </Text>

          <View className="items-center justify-center mb-10 h-32">
            {isRecording ? (
              <View className="items-center">
                <View className="flex-row gap-1 items-center mb-4">
                  {[24, 40, 56, 36, 28].map((height, index) => (
                    <View key={index} className="bg-brand-500 w-1.5 rounded-full opacity-60" style={{ height }} />
                  ))}
                </View>
                <Text className="text-brand-600 font-bold font-sans text-2xl">{formatTime(seconds)}</Text>
              </View>
            ) : isProcessing ? (
              <ActivityIndicator size="large" color="#1f57e7" />
            ) : (
              <View className="bg-slate-50 p-8 rounded-full border border-slate-100">
                <Mic size={48} color="#cbd5e1" />
              </View>
            )}
          </View>

          <Pressable
            onPress={handleToggleRecording}
            disabled={isProcessing}
            className={`w-full py-5 rounded-2xl items-center flex-row justify-center gap-3 ${isRecording ? 'bg-red-500' : 'bg-brand-600'}`}
          >
            {isRecording ? <Waves size={20} color="#ffffff" /> : <Mic size={20} color="#ffffff" />}
            <Text className="text-white font-bold text-lg font-sans">
              {isRecording ? 'Berhenti & Proses' : 'Mulai Bicara'}
            </Text>
          </Pressable>

          <Text className="text-slate-400 font-sans text-xs mt-6 font-medium">Teknologi Smart Voice DompetIQ</Text>
        </View>
      </View>
    </Modal>
  );
}
