import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { BottomSheet } from '@/components/BottomSheet';
import { SheetOption } from '@/components/SheetOption';
import { useAuth } from '@/features/auth/AuthProvider';
import { useChannelInbox } from '@/features/inbox/ChannelInboxProvider';
import { colors, spacing } from '@/theme/colors';

const AVATAR_SIZE = 36;

/** App title plus the account avatar, whose menu offers clearing cached data and signing out. */
export function InboxHeader() {
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
      <View style={styles.titles}>
        <Text style={styles.title}>Channel Desk</Text>
        <Text style={styles.subtitle}>Your subscriptions, organized by topic</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Account ${user.email}`}
        onPress={() => setIsAccountMenuVisible(true)}
        hitSlop={8}
      >
        <Avatar imageUrl={user.photoUrl} name={user.displayName} size={AVATAR_SIZE} />
      </Pressable>

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
          Clearing reloads your subscriptions from YouTube. Folders and the sort order are kept.
        </Text>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    paddingVertical: spacing.medium,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
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
