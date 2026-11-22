import { describe, expect, it } from '@jest/globals';

import { mapWithConcurrency } from './mapWithConcurrency';

function waitMilliseconds(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

describe('mapWithConcurrency', () => {
  it('keeps results in input order even when calls finish out of order', async () => {
    const results = await mapWithConcurrency([30, 10, 20], 3, async (delay) => {
      await waitMilliseconds(delay);
      return delay * 2;
    });

    expect(results).toEqual([60, 20, 40]);
  });

  it('never runs more calls at once than the limit', async () => {
    let runningCount = 0;
    let highestRunningCount = 0;

    await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7], 2, async () => {
      runningCount += 1;
      highestRunningCount = Math.max(highestRunningCount, runningCount);
      await waitMilliseconds(5);
      runningCount -= 1;
    });

    expect(highestRunningCount).toBe(2);
  });

  it('reports progress after each item', async () => {
    const progress: number[] = [];

    await mapWithConcurrency(['a', 'b', 'c'], 1, async (item) => item, (count) => progress.push(count));

    expect(progress).toEqual([1, 2, 3]);
  });

  it('handles an empty list', async () => {
    expect(await mapWithConcurrency([], 4, async () => 1)).toEqual([]);
  });

  it('rejects when a call fails', async () => {
    await expect(
      mapWithConcurrency([1, 2], 2, async (value) => {
        if (value === 2) {
          throw new Error('boom');
        }
        return value;
      }),
    ).rejects.toThrow('boom');
  });
});
