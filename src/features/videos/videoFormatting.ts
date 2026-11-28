const ISO_8601_DURATION_PATTERN =
  /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;

/**
 * Converts YouTube's ISO 8601 durations ("PT1H11M11S", "P1DT2H") to seconds. Returns null for
 * anything else, including "P0D", which YouTube uses for live streams.
 */
export function parseIsoDuration(isoDuration: string): number | null {
  const match = ISO_8601_DURATION_PATTERN.exec(isoDuration);

  if (!match) {
    return null;
  }

  const [, days = '0', hours = '0', minutes = '0', seconds = '0'] = match;
  const totalSeconds =
    Number(days) * 86_400 + Number(hours) * 3_600 + Number(minutes) * 60 + Math.floor(Number(seconds));

  return totalSeconds > 0 ? totalSeconds : null;
}

/** 337 -> "5:37", 4271 -> "1:11:11", like YouTube's thumbnail badge. */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const paddedSeconds = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds}`;
  }

  return `${minutes}:${paddedSeconds}`;
}

const COMPACT_UNITS: readonly { size: number; suffix: string }[] = [
  { size: 1_000_000_000, suffix: 'B' },
  { size: 1_000_000, suffix: 'M' },
  { size: 1_000, suffix: 'K' },
];

/** 938 -> "938", 938_412 -> "938K", 6_612_000 -> "6.6M", 12_400_000 -> "12M". */
export function formatCompactCount(count: number): string {
  const unit = COMPACT_UNITS.find((candidate) => count >= candidate.size);

  if (!unit) {
    return String(count);
  }

  const scaledCount = count / unit.size;
  // One decimal below 10 ("6.6M"), none above ("12M"), and never a trailing ".0".
  const roundedCount =
    scaledCount < 10 ? Math.floor(scaledCount * 10) / 10 : Math.floor(scaledCount);

  return `${roundedCount}${unit.suffix}`;
}
