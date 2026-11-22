import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import type { FolderNameValidation, TopicFolder } from '@/features/folders/folderLibrary';
import { useChannelInbox } from '@/features/inbox/ChannelInboxProvider';
import { colors, spacing } from '@/theme/colors';

import { FolderNameForm } from './FolderNameForm';

type FolderPickerSheetProps = {
  isVisible: boolean;
  selectedCount: number;
  /** The folder the channels are in now, which is left out of the list. */
  currentFolderId?: string;
  onFolderPicked: (folderId: string) => void;
  onClose: () => void;
};

/** Lets the user pick the folder to move the selected channels into, or create a new one. */
export function FolderPickerSheet({
  isVisible,
  selectedCount,
  currentFolderId,
  onFolderPicked,
  onClose,
}: FolderPickerSheetProps) {
  const { library, createFolder } = useChannelInbox();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const destinationFolders = library.folders.filter((folder) => folder.id !== currentFolderId);

  function close() {
    setIsCreatingFolder(false);
    onClose();
  }

  function createFolderAndPickIt(proposedName: string): FolderNameValidation {
    const result = createFolder(proposedName);

    if (result.isValid && result.folderId) {
      setIsCreatingFolder(false);
      onFolderPicked(result.folderId);
    }

    return result;
  }

  const channelsLabel = selectedCount === 1 ? '1 channel' : `${selectedCount} channels`;

  return (
    <BottomSheet
      isVisible={isVisible}
      title={isCreatingFolder ? 'New folder' : `Move ${channelsLabel} to`}
      onClose={close}
    >
      {isCreatingFolder ? (
        <FolderNameForm
          submitLabel="Create and move"
          onSubmit={createFolderAndPickIt}
          onCancel={() => setIsCreatingFolder(false)}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.options}>
          <PickerOption
            iconName="folder-plus-outline"
            label="New folder…"
            isHighlighted
            onPress={() => setIsCreatingFolder(true)}
          />
          {destinationFolders.map((folder) => (
            <FolderOption key={folder.id} folder={folder} onPress={onFolderPicked} />
          ))}
        </ScrollView>
      )}
    </BottomSheet>
  );
}

function FolderOption({
  folder,
  onPress,
}: {
  folder: TopicFolder;
  onPress: (folderId: string) => void;
}) {
  return (
    <PickerOption
      iconName={folder.isPinned ? 'pin' : 'folder-outline'}
      label={folder.name}
      onPress={() => onPress(folder.id)}
    />
  );
}

type PickerOptionProps = {
  iconName: 'folder-plus-outline' | 'folder-outline' | 'pin';
  label: string;
  isHighlighted?: boolean;
  onPress: () => void;
};

function PickerOption({ iconName, label, isHighlighted = false, onPress }: PickerOptionProps) {
  const contentColor = isHighlighted ? colors.accent : colors.textPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && styles.pressedOption]}
    >
      <MaterialCommunityIcons name={iconName} size={22} color={contentColor} />
      <Text style={[styles.optionLabel, { color: contentColor }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: spacing.extraSmall,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    minHeight: 52,
    paddingHorizontal: spacing.medium,
    borderRadius: 12,
  },
  pressedOption: {
    backgroundColor: colors.surfaceBorder,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
});
