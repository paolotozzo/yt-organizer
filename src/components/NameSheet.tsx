import { BottomSheet } from '@/components/BottomSheet';
import { NameForm, type NameFormProps, type NameValidationResult } from '@/components/NameForm';

type NameSheetProps = Omit<NameFormProps, 'onCancel'> & {
  isVisible: boolean;
  title: string;
  /** Return the validation; the sheet closes itself only when the name was accepted. */
  onSubmit: (proposedName: string) => NameValidationResult;
  onClose: () => void;
};

/** A bottom sheet asking for a name, e.g. for a new folder or list, or to rename one. */
export function NameSheet({ isVisible, title, onSubmit, onClose, ...formProps }: NameSheetProps) {
  function submitAndCloseWhenValid(proposedName: string): NameValidationResult {
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
        <NameForm {...formProps} onSubmit={submitAndCloseWhenValid} onCancel={onClose} />
      ) : null}
    </BottomSheet>
  );
}
