import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { NameForm } from '@/components/NameForm';
import { SheetOption } from '@/components/SheetOption';
import {
  FOLDER_NAME_FIELD,
  type FolderNameValidation,
  type TopicFolder,
} from '@/features/folders/folderLibrary';
import { useChannelInbox } from '@/features/inbox/ChannelInboxProvider';
import { spacing } from '@/theme/colors';

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
        <NameForm
          {...FOLDER_NAME_FIELD}
          submitLabel="Create and move"
          onSubmit={createFolderAndPickIt}
          onCancel={() => setIsCreatingFolder(false)}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.options}>
          <SheetOption
            iconName="folder-plus-outline"
            label="New folder…"
            tone="accent"
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
    <SheetOption
      iconName={folder.isPinned ? 'pin' : 'folder-outline'}
      label={folder.name}
      onPress={() => onPress(folder.id)}
    />
  );
}

const styles = StyleSheet.create({
  options: {
    gap: spacing.extraSmall,
  },
});
