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
  onToggleSelection: (channelId: string) => void;
  /** Passed inside a folder, where channels can be pinned to the top. */
  onTogglePin?: (channelId: string, isPinned: boolean) => void;
  isPinned?: boolean;
  /** Extra line under the title, such as the folder or the latest upload time. */
  subtitle?: string;
};

const AVATAR_SIZE = 44;

/** A subscribed channel. Tapping the row selects it, so several can be moved at once. */
export const ChannelRow = memo(function ChannelRow({
  channel,
  isSelected,
  onToggleSelection,
  onTogglePin,
  isPinned = false,
  subtitle,
}: ChannelRowProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={channel.title}
      onPress={() => onToggleSelection(channel.channelId)}
      style={({ pressed }) => [
        styles.row,
        isSelected && styles.selectedRow,
        pressed && !isSelected && styles.pressedRow,
      ]}
    >
      <SelectionIndicator isSelected={isSelected} />
      <Avatar imageUrl={channel.thumbnailUrl} name={channel.title} size={AVATAR_SIZE} />
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>
          {channel.title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {channel.newItemCount > 0 ? <NewItemsBadge count={channel.newItemCount} /> : null}
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

function NewItemsBadge({ count }: { count: number }) {
  return (
    <View style={styles.newItemsBadge} accessibilityLabel={`${count} new`}>
      <Text style={styles.newItemsText}>{count > 99 ? '99+' : count} new</Text>
    </View>
  );
}

function SelectionIndicator({ isSelected }: { isSelected: boolean }) {
  return (
    <MaterialCommunityIcons
      name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
      size={22}
      color={isSelected ? colors.accent : colors.surfaceBorder}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    borderRadius: 12,
    minHeight: 60,
  },
  selectedRow: {
    backgroundColor: colors.selectionBackground,
  },
  pressedRow: {
    backgroundColor: colors.surface,
  },
  details: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  newItemsBadge: {
    paddingHorizontal: spacing.small,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.selectionBackground,
  },
  newItemsText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
});
