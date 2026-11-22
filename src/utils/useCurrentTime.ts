import { useEffect, useState } from 'react';

const ONE_MINUTE = 60 * 1000;

/** The current time in epoch milliseconds, updated every minute, for "x ago" labels. */
export function useCurrentTime(): number {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), ONE_MINUTE);
    return () => clearInterval(interval);
  }, []);

  return currentTime;
}
