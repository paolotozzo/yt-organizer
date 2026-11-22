import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing } from '@/theme/colors';

type InboxStatusViewProps =
  | { status: 'loading' }
  | { status: 'failed'; errorMessage: string; onRetry: () => void };

/** Full-screen state shown before the subscriptions and folders are ready. */
export function InboxStatusView(props: InboxStatusViewProps) {
  if (props.status === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.message}>Loading your subscriptions…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.errorMessage}>{props.errorMessage}</Text>
      <PrimaryButton label="Try again" onPress={props.onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.medium,
    padding: spacing.large,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  errorMessage: {
    color: colors.danger,
    fontSize: 15,
    textAlign: 'center',
  },
});
