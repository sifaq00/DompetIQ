export interface OCRParsedResult {
  amount: number | null;
  date: string | null;
  possibleCategory: string | null;
}

export class OCRParser {
  /**
   * Main entry for parsing raw OCR text
   */
  static parse(text: string): OCRParsedResult {
    const lines = text.split('\n').map(l => l.trim().toLowerCase());
    
    return {
      amount: this.extractAmount(lines),
      date: this.extractDate(text),
      possibleCategory: null, // Will be handled by AIService using suggestCategory
    };
  }

  /**
   * Find the most likely "Total" amount in a receipt
   * Strategies:
   * 1. Keywords like 'total', 'grand total', 'jumlah'
   * 2. Finding the largest number near the bottom
   */
  private static extractAmount(lines: string[]): number | null {
    let candidateAmount: number | null = null;
    const totalKeywords = ['total', 'jumlah', 'pembayaran', 'netto', 'grand total', 'due'];

    // Search for lines containing keywords + number
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (totalKeywords.some(kw => line.includes(kw))) {
        // Find the numeric value in this line or the next line
        const numbers = line.match(/\d+([.,]\d+)?/g);
        if (numbers) {
          const val = this.cleanNumber(numbers[numbers.length - 1]);
          if (val > 100) return val; // Heuristic: amounts usually > 100
        }
        
        // Check next line
        if (i + 1 < lines.length) {
          const nextLineNumbers = lines[i+1].match(/\d+([.,]\d+)?/g);
          if (nextLineNumbers) {
            const val = this.cleanNumber(nextLineNumbers[nextLineNumbers.length - 1]);
            if (val > 100) return val;
          }
        }
      }
    }

    // Fallback: Just look for the largest number found in the text (heuristic)
    const allNumbers = lines.join(' ').match(/\d+([.,]\d+)?/g) || [];
    const values = allNumbers.map(n => this.cleanNumber(n)).filter(v => v < 10000000); // Sanity check < 10jt
    if (values.length > 0) {
      candidateAmount = Math.max(...values);
    }

    return candidateAmount;
  }

  private static extractDate(text: string): string | null {
    // Regex for typical ID formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
    const dateRegex = /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})|(\d{4})[/-](\d{1,2})[/-](\d{1,2})/;
    const match = text.match(dateRegex);
    if (match) {
      // For now, return the match. In a real app we'd normalize to ISO.
      return match[0];
    }
    return null;
  }

  private static cleanNumber(numStr: string): number {
    // Replace comma with dot for parsing, then remove all non-digits except decimal
    const normalized = numStr.replace(/,/g, '.').replace(/[^\d.]/g, '');
    const val = parseFloat(normalized);
    return isNaN(val) ? 0 : val;
  }
}
