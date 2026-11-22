import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme/colors';

type SegmentedControlOption<Value extends string> = {
  value: Value;
  label: string;
};

type SegmentedControlProps<Value extends string> = {
  options: readonly SegmentedControlOption<Value>[];
  selectedValue: Value;
  onChange: (value: Value) => void;
};

export function SegmentedControl<Value extends string>({
  options,
  selectedValue,
  onChange,
}: SegmentedControlProps<Value>) {
  return (
    <View style={styles.control} accessibilityRole="tablist">
      {options.map((option) => {
        const isSelected = option.value === selectedValue;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, isSelected && styles.selectedSegment]}
          >
            <Text style={[styles.label, isSelected && styles.selectedLabel]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  control: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  segment: {
    paddingVertical: 6,
    paddingHorizontal: spacing.medium,
    borderRadius: 9,
  },
  selectedSegment: {
    backgroundColor: colors.surfaceBorder,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  selectedLabel: {
    color: colors.textPrimary,
  },
});
