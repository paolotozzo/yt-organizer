import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import type { IconName } from '@/components/IconButton';
import { NameForm, type NameValidationResult } from '@/components/NameForm';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SheetOption } from '@/components/SheetOption';
import { FOLDER_NAME_FIELD, type TopicFolder } from '@/features/folders/folderLibrary';
import {
  getNextTopicCheckState,
  getTopicCheckStates,
  getTopicMembershipChanges,
  type TopicCheckState,
} from '@/features/folders/topicChecks';
import { useChannelInbox } from '@/features/inbox/ChannelInboxProvider';
import { colors, spacing } from '@/theme/colors';

type TopicsSheetProps = {
  isVisible: boolean;
  /** The channels whose topics are edited together. */
  channelIds: readonly string[];
  /** E.g. "Topics for Lex Fridman"; defaults to "Topics for 3 channels". */
  title?: string;
  /** Called after Done applied the changes, e.g. to clear the selection. */
  onApplied?: () => void;
  onClose: () => void;
};

/**
 * Picks the topics (folders) of one or more channels, like labels in Gmail. Each topic shows
 * whether all, some or none of the channels are in it; Done applies what was changed.
 */
export function TopicsSheet({
  isVisible,
  channelIds,
  title,
  onApplied,
  onClose,
}: TopicsSheetProps) {
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const channelsLabel = channelIds.length === 1 ? '1 channel' : `${channelIds.length} channels`;

  function close() {
    setIsCreatingTopic(false);
    onClose();
  }

  return (
    <BottomSheet
      isVisible={isVisible}
      title={isCreatingTopic ? 'New topic' : (title ?? `Topics for ${channelsLabel}`)}
      onClose={close}
    >
      {/* Mounted only while visible, so every opening starts from the current topics. */}
      {isVisible ? (
        <TopicChecklist
          channelIds={channelIds}
          isCreatingTopic={isCreatingTopic}
          onCreatingTopicChange={setIsCreatingTopic}
          onApplied={() => {
            onApplied?.();
            close();
          }}
          onCancel={close}
        />
      ) : null}
    </BottomSheet>
  );
}

type TopicChecklistProps = {
  channelIds: readonly string[];
  isCreatingTopic: boolean;
  onCreatingTopicChange: (isCreatingTopic: boolean) => void;
  onApplied: () => void;
  onCancel: () => void;
};

function TopicChecklist({
  channelIds,
  isCreatingTopic,
  onCreatingTopicChange,
  onApplied,
  onCancel,
}: TopicChecklistProps) {
  const { library, createFolder, changeFolderMemberships } = useChannelInbox();
  const [initialStates] = useState(() => getTopicCheckStates(library, channelIds));
  const [currentStates, setCurrentStates] = useState(initialStates);

  function toggleTopic(folderId: string) {
    const initialState = initialStates[folderId] ?? 'unchecked';
    const currentState = currentStates[folderId] ?? initialState;
    setCurrentStates({
      ...currentStates,
      [folderId]: getNextTopicCheckState(initialState, currentState),
    });
  }

  function createTopicAndCheckIt(proposedName: string): NameValidationResult {
    const result = createFolder(proposedName);

    if (result.isValid && result.folderId) {
      setCurrentStates({ ...currentStates, [result.folderId]: 'checked' });
      onCreatingTopicChange(false);
    }

    return result;
  }

  function applyChanges() {
    changeFolderMemberships(
      [...channelIds],
      getTopicMembershipChanges(initialStates, currentStates),
    );
    onApplied();
  }

  if (isCreatingTopic) {
    return (
      <NameForm
        {...FOLDER_NAME_FIELD}
        submitLabel="Create"
        onSubmit={createTopicAndCheckIt}
        onCancel={() => onCreatingTopicChange(false)}
      />
    );
  }

  return (
    <View style={styles.checklist}>
      <ScrollView contentContainerStyle={styles.topics}>
        {library.folders.map((folder) => (
          <TopicOption
            key={folder.id}
            folder={folder}
            checkState={currentStates[folder.id] ?? 'unchecked'}
            onPress={() => toggleTopic(folder.id)}
          />
        ))}
        <SheetOption
          iconName="folder-plus-outline"
          label="New topic…"
          tone="accent"
          onPress={() => onCreatingTopicChange(true)}
        />
      </ScrollView>
      <View style={styles.buttons}>
        <PrimaryButton label="Cancel" variant="outlined" onPress={onCancel} style={styles.button} />
        <PrimaryButton label="Done" onPress={applyChanges} style={styles.button} />
      </View>
    </View>
  );
}

const CHECK_ICON_BY_STATE: Record<TopicCheckState, IconName> = {
  checked: 'checkbox-marked',
  partial: 'minus-box',
  unchecked: 'checkbox-blank-outline',
};

const CHECK_DESCRIPTION_BY_STATE: Record<TopicCheckState, string> = {
  checked: 'all selected channels are in it',
  partial: 'some selected channels are in it',
  unchecked: 'not in it',
};

type TopicOptionProps = {
  folder: TopicFolder;
  checkState: TopicCheckState;
  onPress: () => void;
};

function TopicOption({ folder, checkState, onPress }: TopicOptionProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={`${folder.name}, ${CHECK_DESCRIPTION_BY_STATE[checkState]}`}
      accessibilityState={{
        checked: checkState === 'partial' ? 'mixed' : checkState === 'checked',
      }}
      onPress={onPress}
      style={({ pressed }) => [styles.topic, pressed && styles.pressedTopic]}
    >
      <MaterialCommunityIcons
        name={CHECK_ICON_BY_STATE[checkState]}
        size={24}
        color={checkState === 'unchecked' ? colors.textSecondary : colors.accent}
      />
      <Text style={styles.topicName} numberOfLines={1}>
        {folder.name}
      </Text>
      {folder.isPinned ? (
        <MaterialCommunityIcons name="pin" size={16} color={colors.textSecondary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  checklist: {
    flexShrink: 1,
    gap: spacing.medium,
  },
  topics: {
    gap: spacing.extraSmall,
  },
  topic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    minHeight: 52,
    paddingHorizontal: spacing.medium,
    borderRadius: 12,
  },
  pressedTopic: {
    backgroundColor: colors.surfaceBorder,
  },
  topicName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  button: {
    flex: 1,
  },
});
