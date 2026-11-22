import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { colors, navigationTheme } from '@/theme/colors';

export default function RootLayout() {
  return (
    <ThemeProvider value={navigationTheme}>
      <AuthProvider>
        <StatusBar style="light" />
        <AuthenticatedNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

/**
 * Only the screens matching the auth state are reachable: signed-out users see the
 * sign-in screen, signed-in users see the app. Switching state redirects automatically.
 */
function AuthenticatedNavigator() {
  const { status } = useAuth();

  if (status === 'restoring') {
    return <FullScreenLoader />;
  }

  const isSignedIn = status === 'signedIn';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

function FullScreenLoader() {
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
