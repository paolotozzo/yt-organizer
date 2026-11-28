import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

/**
 * A dark strip behind Android's navigation buttons. The app draws edge to edge, so without it
 * those buttons sit straight on top of the list scrolling underneath. Render it last.
 */
export function NavigationBarScrim() {
  const { bottom } = useSafeAreaInsets();

  if (bottom === 0) {
    return null;
  }

  return <View pointerEvents="none" style={[styles.scrim, { height: bottom }]} />;
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.navigationBarScrim,
  },
});
