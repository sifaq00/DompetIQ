export interface OCRParsedResult {
  amount: number | null;
  date: string | null;
  possibleCategory: string | null;
  merchant: string | null;
}

type AmountCandidate = {
  amount: number;
  score: number;
};

export class OCRParser {
  private static readonly TOTAL_KEYWORDS = [
    'grand total',
    'total belanja',
    'total pembelian',
    'jumlah bayar',
    'jumlah tagihan',
    'tagihan',
    'jumlah',
    'total',
    'ttl',
    'bayar',
    'payment',
    'paid',
    'dibayar',
    'debit',
    'kredit',
    'cash',
    'tunai',
    'due',
    'netto',
  ];

  private static readonly NEGATIVE_KEYWORDS = [
    'subtotal',
    'sub total',
    'sub-total',
    'tax',
    'pajak',
    'ppn',
    'pb1',
    'diskon',
    'discount',
    'disc',
    'promo',
    'voucher',
    'change',
    'kembali',
    'kembalian',
    'admin',
    'service',
    'servis',
    'biaya',
    'qty',
    'jumlah item',
    'total item',
    'kartu',
    'card',
  ];

  static parse(text: string): OCRParsedResult {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    return {
      amount: this.extractAmount(lines),
      date: this.extractDate(text),
      possibleCategory: null,
      merchant: this.extractMerchant(lines),
    };
  }

  private static extractAmount(lines: string[]): number | null {
    const candidates: AmountCandidate[] = [];

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const lowerLine = line.toLowerCase();
      const numbers = this.extractNumericTokens(line);

      if (numbers.length === 0) continue;

      for (const token of numbers) {
        const amount = this.cleanNumber(token);
        if (!Number.isFinite(amount) || amount < 100 || amount > 10_000_000) continue;

        let score = amount;

        if (this.TOTAL_KEYWORDS.some((keyword) => lowerLine.includes(keyword))) {
          score += 5_000_000;
        }

        if (this.NEGATIVE_KEYWORDS.some((keyword) => lowerLine.includes(keyword))) {
          score -= 4_000_000;
        }

        if (index >= lines.length - 4) {
          score += 250_000;
        }

        if (/rp/i.test(line)) {
          score += 100_000;
        }

        candidates.push({ amount, score });
      }

      // Cek baris berikutnya untuk nilai, jika baris ini berisi keyword total tanpa nilai yang valid
      if (this.TOTAL_KEYWORDS.some((keyword) => lowerLine.includes(keyword))) {
        // Coba lihat sampai 2 baris ke depan karena terkadang terpotong newline ganda
        for (let j = 1; j <= 2; j++) {
          if (index + j < lines.length) {
            const nextLineNumbers = this.extractNumericTokens(lines[index + j]);
            for (const token of nextLineNumbers) {
              const amount = this.cleanNumber(token);
              if (!Number.isFinite(amount) || amount < 100 || amount > 10_000_000) continue;

              candidates.push({
                amount,
                score: amount + 4_500_000,
              });
            }
          }
        }
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    return candidates.sort((a, b) => b.score - a.score)[0]?.amount ?? null;
  }

  private static extractDate(text: string): string | null {
    // DD/MM/YYYY, DD-MM-YYYY, YYYY/MM/DD, YYYY-MM-DD
    // Atau format bulan huruf seperti 14 Mar 2026, 14 Maret 2026
    const dateRegexInfoBaru =
      /(\d{1,2})[\s/-]([a-zA-Z]{3,9}|\d{1,2})[\s/-](\d{2,4})|(\d{4})[\s/-](\d{1,2})[\s/-](\d{1,2})/;
    const match = text.match(dateRegexInfoBaru);
    
    // Normalisasi format ke YYYY-MM-DD standar atau biarkan string date utuh (nanti di parsing)
    return match?.[0] ?? null;
  }

  private static extractMerchant(lines: string[]): string | null {
    const IGNORED_HEADERS = ['selamat', 'welcome', 'npwp', 'jl.', 'jalan', 'telp', 'no.', 'nota', 'struk', 'kasir', 'tanggal'];

    for (const line of lines.slice(0, 7)) {
      const normalized = line.replace(/[^\p{L}\p{N}\s.&-]/gu, '').trim();
      if (!normalized) continue;
      if (this.extractNumericTokens(normalized).length > 0) continue;
      if (normalized.length < 3) continue;

      const lower = normalized.toLowerCase();
      if (IGNORED_HEADERS.some((h) => lower.includes(h))) continue;

      return normalized;
    }

    return null;
  }

  private static extractNumericTokens(line: string): string[] {
    return line.match(/(?:rp\.?\s*)?\d[\d.,]*/gi) ?? [];
  }

  private static cleanNumber(token: string): number {
    const normalized = token.replace(/rp\.?\s*/gi, '').trim();
    if (!normalized) return 0;

    const hasComma = normalized.includes(',');
    const hasDot = normalized.includes('.');

    if (hasComma && hasDot) {
      return Number(normalized.replace(/\./g, '').replace(',', '.'));
    }

    if (hasComma) {
      const parts = normalized.split(',');
      const decimalCandidate = parts.at(-1) ?? '';
      if (decimalCandidate.length <= 2) {
        return Number(normalized.replace(/\./g, '').replace(',', '.'));
      }
      return Number(normalized.replace(/,/g, ''));
    }

    if (hasDot) {
      const parts = normalized.split('.');
      const decimalCandidate = parts.at(-1) ?? '';
      if (decimalCandidate.length <= 2 && parts.length === 2) {
        return Number(normalized.replace(',', ''));
      }
      return Number(normalized.replace(/\./g, ''));
    }

    return Number(normalized.replace(/[^\d]/g, ''));
  }
}
