/**
 * Like `Promise.all(items.map(mapItem))`, but runs at most `concurrencyLimit` calls at a time,
 * so hundreds of requests don't all hit the network at once. Results keep the input order.
 * `onItemDone` reports progress after each item.
 */
export async function mapWithConcurrency<Item, Result>(
  items: readonly Item[],
  concurrencyLimit: number,
  mapItem: (item: Item) => Promise<Result>,
  onItemDone?: (completedCount: number) => void,
): Promise<Result[]> {
  const results: Result[] = new Array(items.length);
  let nextIndex = 0;
  let completedCount = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapItem(items[index]);
      completedCount += 1;
      onItemDone?.(completedCount);
    }
  }

  const workerCount = Math.max(1, Math.min(concurrencyLimit, items.length));
  await Promise.all(Array.from({ length: workerCount }, runWorker));

  return results;
}
