import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { MAX_FOLDER_NAME_LENGTH, type FolderNameValidation } from '@/features/folders/folderLibrary';
import { colors, spacing } from '@/theme/colors';

type FolderNameFormProps = {
  initialName?: string;
  submitLabel: string;
  /** Returns the validation so the form can explain why a name was refused. */
  onSubmit: (proposedName: string) => FolderNameValidation;
  onCancel: () => void;
};

/** Text field plus buttons to name a new folder or rename an existing one. */
export function FolderNameForm({
  initialName = '',
  submitLabel,
  onSubmit,
  onCancel,
}: FolderNameFormProps) {
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
        placeholder="e.g. Tech, Geopolitics, Health"
        placeholderTextColor={colors.textSecondary}
        maxLength={MAX_FOLDER_NAME_LENGTH}
        autoFocus
        autoCapitalize="words"
        returnKeyType="done"
        selectionColor={colors.accent}
        style={styles.input}
        accessibilityLabel="Folder name"
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
