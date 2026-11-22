const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const UNITS: readonly { size: number; name: string }[] = [
  { size: YEAR, name: 'year' },
  { size: MONTH, name: 'month' },
  { size: WEEK, name: 'week' },
  { size: DAY, name: 'day' },
  { size: HOUR, name: 'hour' },
  { size: MINUTE, name: 'minute' },
];

/** "just now", "5 minutes ago", "1 day ago", "3 weeks ago"... Future times count as now. */
export function formatTimeAgo(time: number, now: number): string {
  const elapsed = now - time;
  const unit = UNITS.find((candidate) => elapsed >= candidate.size);

  if (!unit) {
    return 'just now';
  }

  const count = Math.floor(elapsed / unit.size);
  return `${count} ${unit.name}${count === 1 ? '' : 's'} ago`;
}
