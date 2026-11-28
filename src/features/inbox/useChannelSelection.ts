import { useCallback, useMemo, useState } from 'react';

type ChannelSelection = {
  selectedChannelIds: ReadonlySet<string>;
  selectedCount: number;
  toggleChannel: (channelId: string) => void;
  clearSelection: () => void;
};

/** Which channels the user has ticked on the current screen, to move them together. */
export function useChannelSelection(): ChannelSelection {
  const [selectedChannelIds, setSelectedChannelIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const toggleChannel = useCallback((channelId: string) => {
    setSelectedChannelIds((currentSelection) => {
      const nextSelection = new Set(currentSelection);

      if (nextSelection.has(channelId)) {
        nextSelection.delete(channelId);
      } else {
        nextSelection.add(channelId);
      }

      return nextSelection;
    });
  }, []);

  // Keeps the same empty set when nothing is selected, so clearing then causes no re-render.
  const clearSelection = useCallback(
    () =>
      setSelectedChannelIds((currentSelection) =>
        currentSelection.size === 0 ? currentSelection : new Set(),
      ),
    [],
  );

  return useMemo(
    () => ({
      selectedChannelIds,
      selectedCount: selectedChannelIds.size,
      toggleChannel,
      clearSelection,
    }),
    [selectedChannelIds, toggleChannel, clearSelection],
  );
}
