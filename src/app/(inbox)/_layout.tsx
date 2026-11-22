import { Stack } from 'expo-router';

import { useAuth } from '@/features/auth/AuthProvider';
import { ChannelInboxProvider } from '@/features/inbox/ChannelInboxProvider';
import { colors } from '@/theme/colors';

/** Screens of the signed-in app. They share the subscriptions and the folder library. */
export default function InboxLayout() {
  const { session } = useAuth();

  if (!session) {
    return null;
  }

  return (
    // Keyed by user, so switching accounts never carries one user's folders over to another.
    <ChannelInboxProvider key={session.user.id} userId={session.user.id}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </ChannelInboxProvider>
  );
}
