/**
 * Format a Date to YYYY-MM-DD string using LOCAL timezone (not UTC).
 * This prevents off-by-one day errors for timezones ahead of UTC (e.g. Turkey UTC+3).
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}
