import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import type { AuthenticatedUser } from '@/features/auth/authSession';
import { useAuth } from '@/features/auth/AuthProvider';
import type { ScopeCoverage } from '@/features/auth/scopeCoverage';
import { colors, spacing } from '@/theme/colors';

/**
 * Placeholder home screen for signed-in users. It confirms who is signed in and which
 * YouTube permissions were granted, until the first real feature replaces it.
 */
export default function HomeScreen() {
  const { session, signOut } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <UserHeader user={session.user} />
        <PermissionsCard scopeCoverage={session.scopeCoverage} />
      </ScrollView>
      <PrimaryButton label="Sign out" variant="outlined" onPress={signOut} />
    </SafeAreaView>
  );
}

function UserHeader({ user }: { user: AuthenticatedUser }) {
  return (
    <View style={styles.userHeader}>
      {user.photoUrl ? (
        <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitial}>{user.displayName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.userDetails}>
        <Text style={styles.greeting}>Welcome, {user.displayName}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>
    </View>
  );
}

function PermissionsCard({ scopeCoverage }: { scopeCoverage: ScopeCoverage }) {
  const { grantedScopes, missingScopes, isComplete } = scopeCoverage;
  const requestedCount = grantedScopes.length + missingScopes.length;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>YouTube permissions</Text>
      <Text style={isComplete ? styles.cardSummary : styles.cardWarning}>
        {grantedScopes.length} of {requestedCount} granted
      </Text>

      {missingScopes.length > 0 ? (
        <View style={styles.missingList}>
          <Text style={styles.missingIntro}>
            Not granted. Sign out and in again to grant these:
          </Text>
          {missingScopes.map((scope) => (
            <Text key={scope.url} style={styles.missingItem}>
              • {scope.label}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const AVATAR_SIZE = 56;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.large,
  },
  content: {
    paddingVertical: spacing.large,
    gap: spacing.large,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
    gap: spacing.extraSmall,
  },
  greeting: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  email: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.medium,
    gap: spacing.small,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  cardSummary: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  cardWarning: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  missingList: {
    gap: spacing.extraSmall,
  },
  missingIntro: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  missingItem: {
    color: colors.textPrimary,
    fontSize: 13,
  },
});
