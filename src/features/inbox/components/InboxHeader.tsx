import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { BottomSheet } from '@/components/BottomSheet';
import { IconButton } from '@/components/IconButton';
import { SheetOption } from '@/components/SheetOption';
import { useAuth } from '@/features/auth/AuthProvider';
import { useChannelInbox } from '@/features/inbox/ChannelInboxProvider';
import { colors, spacing } from '@/theme/colors';

const AVATAR_SIZE = 36;

/**
 * App title, a button to the user's saved lists, and the account avatar, whose menu offers
 * clearing cached data and signing out.
 */
type InboxHeaderProps = {
  /** A live summary under the title, e.g. how many channels have new uploads. */
  summary: string;
};

export function InboxHeader({ summary }: InboxHeaderProps) {
  const { session, signOut } = useAuth();
  const { clearCachedDataAndReload, isRefreshing } = useChannelInbox();
  const [isAccountMenuVisible, setIsAccountMenuVisible] = useState(false);

  if (!session) {
    return null;
  }

  const { user } = session;

  function clearCacheAndCloseMenu() {
    setIsAccountMenuVisible(false);
    clearCachedDataAndReload();
  }

  function signOutAndCloseMenu() {
    setIsAccountMenuVisible(false);
    signOut();
  }

  return (
    <View style={styles.header}>
      {/* The buttons share the title's row, so they line up with it, not with two lines. */}
      <View style={styles.titleRow}>
        <Text style={styles.title} accessibilityRole="header" accessibilityLabel="Channel Desk">
          Channel<Text style={styles.titleAccent}>Desk</Text>
        </Text>
        <IconButton
          iconName="bookmark-multiple-outline"
          accessibilityLabel="Your lists"
          onPress={() => router.push('/lists')}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Account ${user.email}`}
          onPress={() => setIsAccountMenuVisible(true)}
          hitSlop={8}
        >
          <Avatar imageUrl={user.photoUrl} name={user.displayName} size={AVATAR_SIZE} />
        </Pressable>
      </View>
      <Text style={styles.summary}>{summary}</Text>

      <BottomSheet
        isVisible={isAccountMenuVisible}
        title={user.displayName}
        onClose={() => setIsAccountMenuVisible(false)}
      >
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.menuOptions}>
          <SheetOption
            iconName="cached"
            label="Clear cached data"
            isDisabled={isRefreshing}
            onPress={clearCacheAndCloseMenu}
          />
          <SheetOption
            iconName="logout"
            label="Sign out"
            tone="danger"
            onPress={signOutAndCloseMenu}
          />
        </View>
        <Text style={styles.menuHint}>
          Clearing reloads your subscriptions from YouTube. Folders, lists and the sort order are
          kept.
        </Text>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 2,
    paddingTop: spacing.small,
    paddingBottom: spacing.medium,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  titleAccent: {
    color: colors.accent,
  },
  summary: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  email: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: -spacing.small,
  },
  menuOptions: {
    gap: spacing.extraSmall,
  },
  menuHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
});
