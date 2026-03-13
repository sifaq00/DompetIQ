import { OCRParser } from './ocrParser';
import TextRecognition from '@react-native-ml-kit/text-recognition';

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
    try {
      const result = await TextRecognition.recognize(imageUri);
      const parsed = OCRParser.parse(result.text);
      const category = this.suggestCategory(result.text) || 'Lainnya';
      
      return {
        amount: parsed.amount ?? undefined,
        category: category,
        note: `Scan: ${parsed.date || 'Struk'}`,
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
    // In actual implementation, this would use speech-to-text + NLP.
    return {
      amount: 15000,
      category: 'Transport',
      note: 'Ojek Online (Voice)',
      source: 'voice',
    };
  }

  /**
   * Smart Category Suggestion based on keywords in note
   */
  suggestCategory(note: string): string | null {
    const text = note.toLowerCase();
    const mapping: Record<string, string[]> = {
      'Makan': ['makan', 'nasi', 'kopi', 'restoran', 'cafe', 'go-food', 'grabfood', 'warung', 'sate', 'bakso', 'ayam'],
      'Transport': ['ojek', 'gojek', 'grab', 'bensin', 'parkir', 'tol', 'kereta', 'busway', 'mrt', 'lrt', 'pertalite', 'pertamax'],
      'Belanja': ['minimarket', 'alfamart', 'indomaret', 'tokopedia', 'shopee', 'supermarket', 'baju', 'celana', 'sepatu', 'sabun'],
      'Tagihan': ['listrik', 'pdam', 'internet', 'wifi', 'pulsa', 'kuota', 'netflix', 'spotify', 'icloud'],
      'Hiburan': ['nonton', 'bioskop', 'game', 'topup', 'karaoke', 'jalan-jalan'],
    };

    for (const [category, keywords] of Object.entries(mapping)) {
      if (keywords.some(kw => text.includes(kw))) {
        return category;
      }
    }
    return null;
  }
}

export const aiService = new AIService();
