import test from 'node:test';
import assert from 'node:assert/strict';
import { OCRParser } from '../src/services/ocrParser';

test('OCR parser prefers total line amount and extracts date', () => {
  const text = `
    Toko Maju Jaya
    14/03/2026
    Item A 15000
    Item B 25000
    Total 40000
  `;

  const result = OCRParser.parse(text);

  assert.equal(result.amount, 40000);
  assert.equal(result.date, '14/03/2026');
  assert.equal(result.merchant, 'Toko Maju Jaya');
});

test('OCR parser falls back to largest sane amount when total keyword is absent', () => {
  const text = `
    Kopi Susu 18000
    Roti Bakar 22000
    Tunai 50000
  `;

  const result = OCRParser.parse(text);

  assert.equal(result.amount, 50000);
});

test('OCR parser handles Indonesian thousand separators and ignores subtotal noise', () => {
  const text = `
    INDOMARET
    2026-03-14
    SUBTOTAL RP 12.500
    PPN RP 1.250
    TOTAL RP 13.750
    KEMBALIAN RP 1.250
  `;

  const result = OCRParser.parse(text);

  assert.equal(result.amount, 13750);
  assert.equal(result.date, '2026-03-14');
  assert.equal(result.merchant, 'INDOMARET');
});
