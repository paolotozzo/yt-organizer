/** A practically unique id for something created on this device, e.g. "list-m3k2x9-4f8a1c". */
export function generateLocalId(prefix: string): string {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${randomSuffix}`;
}
