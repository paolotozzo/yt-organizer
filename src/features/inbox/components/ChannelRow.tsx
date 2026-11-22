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
  /** Name of the folder the channel is in, shown when listing channels from every folder. */
  folderName?: string;
};

const AVATAR_SIZE = 44;

/** A subscribed channel. Tapping the row selects it, so several can be moved at once. */
export const ChannelRow = memo(function ChannelRow({
  channel,
  isSelected,
  onToggleSelection,
  onTogglePin,
  isPinned = false,
  folderName,
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
        {folderName ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            in {folderName}
          </Text>
        ) : null}
      </View>
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
});
