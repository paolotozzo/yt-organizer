import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { NameSheet } from '@/components/NameSheet';
import { SheetOption } from '@/components/SheetOption';
import { FOLDER_NAME_FIELD, type TopicFolder } from '@/features/folders/folderLibrary';
import { useChannelInbox } from '@/features/inbox/ChannelInboxProvider';
import { spacing } from '@/theme/colors';

type FolderActionsSheetProps = {
  /** The folder to act on; the sheet is hidden while this is null. */
  folder: TopicFolder | null;
  onClose: () => void;
  /** Called after the folder was deleted, e.g. to show "All" again. */
  onDeleted: () => void;
};

/** Rename, pin or delete a folder, opened from its topic pill. */
export function FolderActionsSheet({ folder, onClose, onDeleted }: FolderActionsSheetProps) {
  const { renameFolder, deleteFolder, setFolderPinned } = useChannelInbox();
  // Kept apart from `folder`, so the rename sheet stays open after this menu closes.
  const [folderToRename, setFolderToRename] = useState<TopicFolder | null>(null);

  function startRenaming(folderToName: TopicFolder) {
    onClose();
    setFolderToRename(folderToName);
  }

  function togglePinned(folderToPin: TopicFolder) {
    setFolderPinned(folderToPin.id, !folderToPin.isPinned);
    onClose();
  }

  function confirmDelete(folderToDelete: TopicFolder) {
    onClose();
    Alert.alert(
      `Delete "${folderToDelete.name}"?`,
      'Its channels move back to Unassigned. You stay subscribed to all of them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteFolder(folderToDelete.id);
            onDeleted();
          },
        },
      ],
    );
  }

  return (
    <>
      <BottomSheet isVisible={folder !== null} title={folder?.name ?? ''} onClose={onClose}>
        {folder ? (
          <View style={styles.options}>
            <SheetOption
              iconName="pencil-outline"
              label="Rename"
              onPress={() => startRenaming(folder)}
            />
            <SheetOption
              iconName={folder.isPinned ? 'pin-off-outline' : 'pin-outline'}
              label={folder.isPinned ? 'Unpin' : 'Pin to the front'}
              onPress={() => togglePinned(folder)}
            />
            <SheetOption
              iconName="trash-can-outline"
              label="Delete folder"
              tone="danger"
              onPress={() => confirmDelete(folder)}
            />
          </View>
        ) : null}
      </BottomSheet>
      <NameSheet
        {...FOLDER_NAME_FIELD}
        isVisible={folderToRename !== null}
        title="Rename folder"
        submitLabel="Save"
        initialName={folderToRename?.name ?? ''}
        onSubmit={(proposedName) => renameFolder(folderToRename?.id ?? '', proposedName)}
        onClose={() => setFolderToRename(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: spacing.extraSmall,
  },
});
