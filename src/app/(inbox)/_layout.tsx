import { Stack } from 'expo-router';

import { useAuth } from '@/features/auth/AuthProvider';
import { ChannelInboxProvider } from '@/features/inbox/ChannelInboxProvider';
import { SavedVideoListsProvider } from '@/features/savedLists/SavedVideoListsProvider';
import { colors } from '@/theme/colors';

/** Screens of the signed-in app. They share the subscriptions, folders and saved lists. */
export default function InboxLayout() {
  const { session } = useAuth();

  if (!session) {
    return null;
  }

  return (
    // Keyed by user, so switching accounts never carries one user's data over to another.
    <ChannelInboxProvider key={session.user.id} userId={session.user.id}>
      <SavedVideoListsProvider key={session.user.id} userId={session.user.id}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </SavedVideoListsProvider>
    </ChannelInboxProvider>
  );
}
