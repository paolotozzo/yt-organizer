import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/IconButton';
import type { SubscribedChannel } from '@/features/subscriptions/subscribedChannel';
import { colors, spacing } from '@/theme/colors';

type ChannelRowProps = {
  channel: SubscribedChannel;
  isSelected: boolean;
  onPress: (channelId: string) => void;
  onLongPress: (channelId: string) => void;
  /** Passed inside a folder, where channels can be pinned to the top. */
  onTogglePin?: (channelId: string, isPinned: boolean) => void;
  isPinned?: boolean;
  /** Extra line under the title, such as the folder or the latest upload time. */
  subtitle?: string;
};

const AVATAR_SIZE = 44;
const SELECTION_INDICATOR_SIZE = 20;
const NEW_ITEMS_DOT_SIZE = 8;

/**
 * A subscribed channel. The screen decides what a tap does (usually open its videos); a long
 * press selects it, so several channels can be moved at once.
 */
export const ChannelRow = memo(function ChannelRow({
  channel,
  isSelected,
  onPress,
  onLongPress,
  onTogglePin,
  isPinned = false,
  subtitle,
}: ChannelRowProps) {
  const hasNewItems = channel.newItemCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={
        hasNewItems ? `${channel.title}, ${channel.newItemCount} new` : channel.title
      }
      accessibilityHint="Long press to select"
      onPress={() => onPress(channel.channelId)}
      onLongPress={() => onLongPress(channel.channelId)}
      delayLongPress={300}
      style={({ pressed }) => [
        styles.row,
        isSelected && styles.selectedRow,
        pressed && !isSelected && styles.pressedRow,
      ]}
    >
      <View>
        <Avatar imageUrl={channel.thumbnailUrl} name={channel.title} size={AVATAR_SIZE} />
        {/* Drawn over the avatar, so selecting a row never shifts its contents sideways. */}
        {isSelected ? <SelectionIndicator /> : null}
      </View>
      <View style={styles.details}>
        <View style={styles.titleRow}>
          {hasNewItems ? <View style={styles.newItemsDot} /> : null}
          <Text style={[styles.title, hasNewItems && styles.unwatchedTitle]} numberOfLines={1}>
            {channel.title}
          </Text>
        </View>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {channel.newItemCount > 1 ? <NewItemsCount count={channel.newItemCount} /> : null}
      {onTogglePin ? (
        <IconButton
          iconName={isPinned ? 'pin' : 'pin-outline'}
          color={isPinned ? colors.pin : colors.textSecondary}
          accessibilityLabel={isPinned ? `Unpin ${channel.title}` : `Pin ${channel.title} to the top`}
          onPress={() => onTogglePin(channel.channelId, !isPinned)}
        />
      ) : null}
    </Pressable>
  );
});

/** Only counts above one are shown: the dot beside the title already says "new". */
function NewItemsCount({ count }: { count: number }) {
  return <Text style={styles.newItemsCount}>{count > 99 ? '99+' : count}</Text>;
}

function SelectionIndicator() {
  return (
    <View style={styles.selectionIndicator}>
      <MaterialCommunityIcons
        name="check-circle"
        size={SELECTION_INDICATOR_SIZE}
        color={colors.accent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    paddingVertical: spacing.small,
    // Small, so avatars line up with the header while pressed rows keep a little margin.
    paddingHorizontal: spacing.small,
    borderRadius: 12,
    minHeight: 60,
  },
  selectedRow: {
    backgroundColor: colors.selectionBackground,
  },
  pressedRow: {
    backgroundColor: colors.surface,
  },
  selectionIndicator: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    // A ring in the background colour separates the tick from the avatar image.
    borderRadius: SELECTION_INDICATOR_SIZE,
    borderWidth: 2,
    borderColor: colors.background,
    backgroundColor: colors.background,
  },
  details: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newItemsDot: {
    width: NEW_ITEMS_DOT_SIZE,
    height: NEW_ITEMS_DOT_SIZE,
    borderRadius: NEW_ITEMS_DOT_SIZE / 2,
    backgroundColor: colors.accent,
  },
  title: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  unwatchedTitle: {
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  newItemsCount: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
});
