import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

type ChannelPressHandlers = {
  handleChannelPress: (channelId: string) => void;
  handleChannelLongPress: (channelId: string) => void;
};

/**
 * What tapping a channel row does: with nothing selected it opens the channel's videos; once
 * a long press has started a selection, taps add or remove channels from it.
 *
 * Both handlers keep the same identity while the selection changes, so memoized rows don't
 * all re-render when a selection starts. That matters on the inbox, which renders every row.
 */
export function useChannelPressHandlers(
  isSelectionMode: boolean,
  toggleChannel: (channelId: string) => void,
): ChannelPressHandlers {
  const isSelectionModeRef = useRef(isSelectionMode);

  useEffect(() => {
    isSelectionModeRef.current = isSelectionMode;
  }, [isSelectionMode]);

  const handleChannelPress = useCallback(
    (channelId: string) => {
      if (isSelectionModeRef.current) {
        toggleChannel(channelId);
        return;
      }

      router.push({ pathname: '/channels/[channelId]', params: { channelId } });
    },
    [toggleChannel],
  );

  const handleChannelLongPress = useCallback(
    (channelId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
        // Haptics are a nicety; devices without a vibration motor just skip them.
      });
      toggleChannel(channelId);
    },
    [toggleChannel],
  );

  return { handleChannelPress, handleChannelLongPress };
}
