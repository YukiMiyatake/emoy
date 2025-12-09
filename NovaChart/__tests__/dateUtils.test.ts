import { describe, it, expect } from 'vitest';
import { formatDateShort, formatDateFull, getDateKey, isSameDay, getStartOfDay, getEndOfDay } from '../lib/utils/date';

describe('date utils', () => {
  it('formats short date', () => {
    const d = new Date('2024-05-10T12:00:00Z');
    expect(formatDateShort(d)).toBe('5/10');
  });

  it('formats full date', () => {
    const d = new Date('2024-05-10T12:00:00Z');
    expect(formatDateFull(d)).toBe('2024/5/10');
  });

  it('creates date key and compares same day', () => {
    const d1 = new Date('2024-05-10T03:00:00Z');
    const d2 = new Date('2024-05-10T22:00:00Z');
    expect(getDateKey(d1)).toBe(getDateKey(d2));
    expect(isSameDay(d1, d2)).toBe(true);
  });

  it('returns start and end of day', () => {
    const d = new Date('2024-05-10T12:34:56Z');
    const start = getStartOfDay(d);
    const end = getEndOfDay(d);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
  });
});

