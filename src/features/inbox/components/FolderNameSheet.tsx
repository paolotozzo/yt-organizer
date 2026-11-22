import { BottomSheet } from '@/components/BottomSheet';
import type { FolderNameValidation } from '@/features/folders/folderLibrary';

import { FolderNameForm } from './FolderNameForm';

type FolderNameSheetProps = {
  isVisible: boolean;
  title: string;
  submitLabel: string;
  initialName?: string;
  /** Return the validation; the sheet closes itself only when the name was accepted. */
  onSubmit: (proposedName: string) => FolderNameValidation;
  onClose: () => void;
};

export function FolderNameSheet({
  isVisible,
  title,
  submitLabel,
  initialName,
  onSubmit,
  onClose,
}: FolderNameSheetProps) {
  function submitAndCloseWhenValid(proposedName: string): FolderNameValidation {
    const validation = onSubmit(proposedName);

    if (validation.isValid) {
      onClose();
    }

    return validation;
  }

  return (
    <BottomSheet isVisible={isVisible} title={title} onClose={onClose}>
      {/* Mounted only while visible, so every opening starts from `initialName`. */}
      {isVisible ? (
        <FolderNameForm
          initialName={initialName}
          submitLabel={submitLabel}
          onSubmit={submitAndCloseWhenValid}
          onCancel={onClose}
        />
      ) : null}
    </BottomSheet>
  );
}
