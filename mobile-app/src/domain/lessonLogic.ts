export const LESSON_UNIT_MIN = 45;
export const LESSON_BREAK_MIN = 15;

export function computeDurationMin(units: number): number {
  const n = Math.max(1, Math.floor(units));
  return n * LESSON_UNIT_MIN + (n - 1) * LESSON_BREAK_MIN;
}

export function unitsFromDuration(durationMin: number): number {
  const cycle = LESSON_UNIT_MIN + LESSON_BREAK_MIN;
  return Math.max(1, Math.round((durationMin + LESSON_BREAK_MIN) / cycle));
}

export function lessonsConflict(
  a: { date: string; durationMin: number },
  b: { date: string; durationMin: number }
): boolean {
  const aStart = new Date(a.date).getTime();
  const aEnd = aStart + a.durationMin * 60000;
  const bStart = new Date(b.date).getTime();
  const bEnd = bStart + b.durationMin * 60000;
  if (aStart < bEnd && bStart < aEnd) return true;
  const gapMs = aStart >= bEnd ? aStart - bEnd : bStart - aEnd;
  return gapMs < LESSON_BREAK_MIN * 60000;
}
