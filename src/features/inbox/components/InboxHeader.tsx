import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors, spacing } from '@/theme/colors';

const AVATAR_SIZE = 36;

/** App title plus the account avatar, which offers signing out. */
export function InboxHeader() {
  const { session, signOut } = useAuth();

  if (!session) {
    return null;
  }

  const { user } = session;

  function confirmSignOut() {
    Alert.alert(user.displayName, user.email, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
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
        onPress={confirmSignOut}
        hitSlop={8}
      >
        <Avatar imageUrl={user.photoUrl} name={user.displayName} size={AVATAR_SIZE} />
      </Pressable>
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
});
