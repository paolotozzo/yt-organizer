import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/components/IconButton';
import { colors, spacing } from '@/theme/colors';

export type SaveTargetStatus = 'notSaved' | 'saving' | 'saved';

type SaveTargetOptionProps = {
  iconName: IconName;
  title: string;
  details: string;
  status: SaveTargetStatus;
  onPress: () => void;
  /** False for YouTube playlists, where a saved video can't be taken out from here. */
  canUnsave?: boolean;
};

/** A list or playlist in the save sheet, showing whether the video is in it. */
export function SaveTargetOption({
  iconName,
  title,
  details,
  status,
  onPress,
  canUnsave = false,
}: SaveTargetOptionProps) {
  const isDisabled = status === 'saving' || (status === 'saved' && !canUnsave);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={describeOption(title, status, canUnsave)}
      accessibilityState={{ disabled: isDisabled, selected: status === 'saved' }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && styles.pressedOption]}
    >
      <MaterialCommunityIcons name={iconName} size={22} color={colors.textPrimary} />
      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.details}>{details}</Text>
      </View>
      <SaveStatusIndicator status={status} />
    </Pressable>
  );
}

function describeOption(title: string, status: SaveTargetStatus, canUnsave: boolean): string {
  if (status !== 'saved') {
    return `Save to ${title}`;
  }

  return canUnsave ? `Remove from ${title}` : `Saved to ${title}`;
}

function SaveStatusIndicator({ status }: { status: SaveTargetStatus }) {
  if (status === 'saving') {
    return <ActivityIndicator size="small" color={colors.accent} />;
  }

  if (status === 'saved') {
    return (
      <View style={styles.savedLabel}>
        <MaterialCommunityIcons name="check" size={18} color={colors.accent} />
        <Text style={styles.savedText}>Saved</Text>
      </View>
    );
  }

  return <MaterialCommunityIcons name="plus" size={22} color={colors.textSecondary} />;
}

export function formatVideoCount(videoCount: number): string {
  return videoCount === 1 ? '1 video' : `${videoCount} videos`;
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    minHeight: 56,
    paddingHorizontal: spacing.medium,
    borderRadius: 12,
  },
  pressedOption: {
    backgroundColor: colors.surfaceBorder,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  details: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  savedLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  savedText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
});
