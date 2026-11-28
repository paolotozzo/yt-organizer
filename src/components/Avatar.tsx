import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

type AvatarProps = {
  imageUrl: string | null;
  /** Its first letter is shown when there is no image. */
  name: string;
  size: number;
};

export function Avatar({ imageUrl, name, size }: AvatarProps) {
  const circleStyle = { width: size, height: size, borderRadius: size / 2 };

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={circleStyle}
        cachePolicy="memory-disk"
        recyclingKey={imageUrl}
        // No fade-in: in recycled lists it made every row blink when the list changed.
      />
    );
  }

  return (
    <View style={[circleStyle, styles.placeholder]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
