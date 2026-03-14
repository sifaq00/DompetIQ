import { OCRParser } from './ocrParser';
import { Platform } from 'react-native';

export type AIParseResult = {
  amount?: number;
  category?: string;
  note?: string;
  source: 'ocr' | 'voice';
};

export class AIService {
  /**
   * Real offline OCR using ML Kit
   */
  async parseReceiptFromImage(imageUri: string): Promise<AIParseResult> {
    if (Platform.OS === 'web') {
      throw new Error('Scan struk belum didukung di web.');
    }

    try {
      const { default: TextRecognition } = await import('@react-native-ml-kit/text-recognition');
      const result = await TextRecognition.recognize(imageUri);
      const parsed = OCRParser.parse(result.text);
      const textForCategory = [parsed.merchant, result.text].filter(Boolean).join(' ');
      const category = this.suggestCategory(textForCategory) || parsed.possibleCategory || 'Lainnya';
      const noteParts = [parsed.merchant, parsed.date].filter(Boolean);
      
      return {
        amount: parsed.amount ?? undefined,
        category: category,
        note: noteParts.length > 0 ? `Scan: ${noteParts.join(' - ')}` : 'Scan struk',
        source: 'ocr',
      };
    } catch (error) {
      console.error('[AIService] OCR Error:', error);
      return { amount: 0, category: 'Lainnya', note: 'Gagal scan', source: 'ocr' };
    }
  }

  /**
   * Stub Voice Input for Tahap 2
   */
  async parseTransactionFromVoice(audioFilePath: string): Promise<AIParseResult> {
    console.log('[AIService] Stub parseTransactionFromVoice called with file:', audioFilePath);
    throw new Error('Fitur input suara belum tersedia.');
  }

  /**
   * Smart Category Suggestion based on keywords in note or merchant
   */
  suggestCategory(text: string): string | null {
    const lowerText = text.toLowerCase();
    const mapping: Record<string, string[]> = {
      'Makan & Minum': ['makan', 'minum', 'nasi', 'kopi', 'restoran', 'cafe', 'go-food', 'gofood', 'grabfood', 'warung', 'sate', 'bakso', 'ayam', 'teh', 'boba', 'roti', 'kue', 'mie', 'food', 'resto'],
      'Transportasi': ['ojek', 'gojek', 'grab', 'bensin', 'parkir', 'tol', 'kereta', 'busway', 'mrt', 'lrt', 'pertalite', 'pertamax', 'shell', 'krl', 'tiket', 'travel'],
      'Belanja': ['minimarket', 'alfamart', 'indomaret', 'tokopedia', 'shopee', 'supermarket', 'baju', 'celana', 'sepatu', 'sabun', 'shampo', 'hypermart', 'transmart', 'superindo', 'midi', 'beli'],
      'Tagihan': ['listrik', 'pdam', 'internet', 'wifi', 'pulsa', 'kuota', 'netflix', 'spotify', 'icloud', 'cicilan', 'bpjs', 'pln', 'token', 'pajak'],
      'Hiburan': ['nonton', 'bioskop', 'game', 'topup', 'karaoke', 'jalan-jalan', 'tiket', 'rekreasi', 'cgv', 'xxi'],
      'Kesehatan': ['apotek', 'obat', 'dokter', 'klinik', 'rumah sakit', 'rs', 'vitamin', 'k-24', 'kimia farma'],
    };

    for (const [category, keywords] of Object.entries(mapping)) {
      if (keywords.some(kw => lowerText.includes(kw))) {
        return category;
      }
    }
    return null;
  }
}

export const aiService = new AIService();
