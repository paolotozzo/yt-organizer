import type { ChannelSortOrder } from '@/features/sorting/channelSorting';
import { formatTimeAgo } from '@/features/sorting/formatRelativeTime';

type ChannelSubtitleParts = {
  sortOrder: ChannelSortOrder;
  /** Undefined while the upload has not been checked yet, null when there is none. */
  latestUploadAt: number | null | undefined;
  /** Shown when listing channels from every folder. */
  folderName?: string;
  now: number;
};

/** The line under a channel's title: its folder, plus the latest upload when sorting by it. */
export function describeChannelSubtitle({
  sortOrder,
  latestUploadAt,
  folderName,
  now,
}: ChannelSubtitleParts): string | undefined {
  const parts: string[] = [];

  if (folderName) {
    parts.push(`in ${folderName}`);
  }

  if (sortOrder === 'latestUpload' && latestUploadAt !== undefined) {
    parts.push(
      latestUploadAt === null ? 'No uploads' : `Uploaded ${formatTimeAgo(latestUploadAt, now)}`,
    );
  }

  return parts.length > 0 ? parts.join(' · ') : undefined;
}
