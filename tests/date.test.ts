import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, formatLocalDate, formatLocalMonthKey, getLocalDateKey, getLocalMonthKey, parseStoredDate, startOfLocalDay } from '../src/utils/date';

test('parseStoredDate keeps date-only strings in local calendar date', () => {
  const parsed = parseStoredDate('2026-03-14');

  assert.equal(parsed.getFullYear(), 2026);
  assert.equal(parsed.getMonth(), 2);
  assert.equal(parsed.getDate(), 14);
});

test('local date helpers derive stable keys from ISO timestamps', () => {
  const value = '2026-03-14T10:15:00.000Z';

  assert.match(getLocalDateKey(value), /^\d{4}-\d{2}-\d{2}$/);
  assert.match(getLocalMonthKey(value), /^\d{4}-\d{2}$/);
});

test('startOfLocalDay and addDays keep date arithmetic predictable', () => {
  const start = startOfLocalDay(new Date(2026, 2, 14, 18, 45));
  const next = addDays(start, 3);

  assert.equal(formatLocalDate(start), '2026-03-14');
  assert.equal(formatLocalMonthKey(next), '2026-03');
  assert.equal(formatLocalDate(next), '2026-03-17');
});
