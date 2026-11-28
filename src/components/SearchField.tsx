import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { colors, spacing } from '@/theme/colors';

type SearchFieldProps = {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder: string;
  style?: StyleProp<ViewStyle>;
};

/** A rounded text field with a magnifier that filters as you type, plus a button to clear it. */
export function SearchField({ query, onQueryChange, placeholder, style }: SearchFieldProps) {
  return (
    <View style={[styles.field, style]}>
      <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
      <TextInput
        value={query}
        onChangeText={onQueryChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        selectionColor={colors.accent}
        style={styles.input}
        accessibilityLabel={placeholder}
      />
      {query.length > 0 ? (
        <IconButton
          iconName="close-circle"
          size={18}
          color={colors.textSecondary}
          accessibilityLabel="Clear search"
          onPress={() => onQueryChange('')}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    minHeight: 44,
    paddingLeft: spacing.medium,
    paddingRight: spacing.extraSmall,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.small,
    color: colors.textPrimary,
    fontSize: 15,
  },
});
