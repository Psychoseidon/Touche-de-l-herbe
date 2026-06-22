const DAY_MS = 1000 * 60 * 60 * 24;

export function isPastDate(date: Date): boolean {
  return date.getTime() < Date.now();
}

export function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / DAY_MS);
}
