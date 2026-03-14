import React, { useState } from 'react';
import { Modal, View, Text, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { Camera as CameraIcon, X, Zap } from 'lucide-react-native';

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (imageUri: string) => void;
}

export function CameraModal({ visible, onClose, onCapture }: CameraModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const startScan = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Scan belum tersedia', 'Fitur scan struk saat ini hanya tersedia di Android atau iOS.');
      onClose();
      return;
    }

    try {
      setIsProcessing(true);
      const { default: DocumentScanner } = await import('react-native-document-scanner-plugin');
      const { scannedImages } = await DocumentScanner.scanDocument({
        maxNumDocuments: 1,
      });

      if (scannedImages && scannedImages.length > 0) {
        onCapture(scannedImages[0]);
      }
    } catch (error) {
      console.error('[CameraModal] Scan Error:', error);
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black justify-center items-center">
        <View className="absolute top-12 right-6 z-50">
           <Pressable onPress={onClose} className="bg-white/20 p-3 rounded-full">
             <X size={24} color="#ffffff" />
           </Pressable>
        </View>

        <View className="w-[80%] aspect-[3/4] border-2 border-brand-400 border-dashed rounded-3xl items-center justify-center">
           {!isProcessing ? (
             <CameraIcon size={48} color="#ffffff" opacity={0.5} />
           ) : (
             <ActivityIndicator size="large" color="#1f57e7" />
           )}
           <Text className="text-white font-sans mt-4 text-center px-6">
             {isProcessing ? 'Menganalisis Struk...' : 'Posisikan struk belanja di dalam kotak'}
           </Text>
        </View>

        <View className="absolute bottom-16 items-center w-full">
           <Pressable 
             onPress={startScan}
             disabled={isProcessing}
             className={`w-20 h-20 rounded-full border-4 border-white items-center justify-center ${isProcessing ? 'opacity-50' : ''}`}
           >
             <View className="w-16 h-16 bg-white rounded-full items-center justify-center">
                <Zap size={24} color="#1741b5" />
             </View>
           </Pressable>
           <Text className="text-white font-sans mt-4 font-bold">Ambil Foto Struk</Text>
        </View>
      </View>
    </Modal>
  );
}
