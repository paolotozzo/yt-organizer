import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/features/auth/AuthProvider';
import { YOUTUBE_SCOPES } from '@/features/auth/youtubeScopes';
import { colors, spacing } from '@/theme/colors';

export default function SignInScreen() {
  const { status, errorMessage, signIn } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>Channel Desk</Text>
        <Text style={styles.subtitle}>
          Organize your YouTube channel and get more out of every video.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.permissionsNote}>
          You will be asked to grant {YOUTUBE_SCOPES.length} YouTube permissions so the app can
          read, organize and analyze your channel.
        </Text>

        {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}

        <PrimaryButton
          label="Continue with Google"
          onPress={signIn}
          isLoading={status === 'signingIn'}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.large,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.medium,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 40,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 18,
    lineHeight: 26,
  },
  footer: {
    gap: spacing.medium,
  },
  permissionsNote: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
});
