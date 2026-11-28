import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing } from '@/theme/colors';

/** Whether a proposed name was accepted, and if not, why, in words for the user. */
export type NameValidationResult = { isValid: true } | { isValid: false; problem: string };

export type NameFormProps = {
  initialName?: string;
  submitLabel: string;
  /** Example names, e.g. "e.g. Tech, Geopolitics, Health". */
  placeholder: string;
  /** What is being named, read out by screen readers, e.g. "Folder name". */
  accessibilityLabel: string;
  maxLength: number;
  /** Returns the validation so the form can explain why a name was refused. */
  onSubmit: (proposedName: string) => NameValidationResult;
  onCancel: () => void;
};

/** Text field plus buttons to name something new, such as a folder or a list, or rename it. */
export function NameForm({
  initialName = '',
  submitLabel,
  placeholder,
  accessibilityLabel,
  maxLength,
  onSubmit,
  onCancel,
}: NameFormProps) {
  const [proposedName, setProposedName] = useState(initialName);
  const [problem, setProblem] = useState<string | null>(null);

  function submit() {
    const validation = onSubmit(proposedName);
    setProblem(validation.isValid ? null : validation.problem);
  }

  return (
    <View style={styles.form}>
      <TextInput
        value={proposedName}
        onChangeText={(text) => {
          setProposedName(text);
          setProblem(null);
        }}
        onSubmitEditing={submit}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        maxLength={maxLength}
        autoFocus
        autoCapitalize="words"
        returnKeyType="done"
        selectionColor={colors.accent}
        style={styles.input}
        accessibilityLabel={accessibilityLabel}
      />
      {problem ? <Text style={styles.problem}>{problem}</Text> : null}
      <View style={styles.buttons}>
        <PrimaryButton label="Cancel" variant="outlined" onPress={onCancel} style={styles.button} />
        <PrimaryButton label={submitLabel} onPress={submit} style={styles.button} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.medium,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.medium,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.background,
    color: colors.textPrimary,
    fontSize: 16,
  },
  problem: {
    color: colors.danger,
    fontSize: 13,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  button: {
    flex: 1,
  },
});
