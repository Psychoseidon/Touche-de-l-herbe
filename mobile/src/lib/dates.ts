const DAY_MS = 1000 * 60 * 60 * 24;

export function daysSince(date: Date | string): number {
  const target = typeof date === 'string' ? new Date(date) : date;
  return Math.floor((Date.now() - target.getTime()) / DAY_MS);
}
