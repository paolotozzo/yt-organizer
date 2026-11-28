import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/IconButton';
import { NameSheet } from '@/components/NameSheet';
import { NavigationBarScrim } from '@/components/NavigationBarScrim';
import { ScreenTopBar } from '@/components/ScreenTopBar';
import { useSavedVideoLists } from '@/features/savedLists/SavedVideoListsProvider';
import { LIST_NAME_FIELD, type SavedVideoList } from '@/features/savedLists/savedVideoLists';
import { formatVideoCount } from '@/features/videos/components/SaveTargetOption';
import { colors, spacing } from '@/theme/colors';

/** The user's own video lists, kept on this phone. */
export default function SavedListsScreen() {
  const { library, createList } = useSavedVideoLists();
  const [isNewListSheetVisible, setIsNewListSheetVisible] = useState(false);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScreenTopBar title="Your lists" subtitle="Saved on this phone">
        <IconButton
          iconName="bookmark-plus-outline"
          color={colors.accent}
          accessibilityLabel="Create a list"
          onPress={() => setIsNewListSheetVisible(true)}
        />
      </ScreenTopBar>

      <FlatList
        data={library.lists}
        keyExtractor={(list) => list.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: list }) => (
          <SavedListRow
            list={list}
            onPress={() =>
              router.push({ pathname: '/lists/[listId]', params: { listId: list.id } })
            }
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyHint}>
            No lists yet. Tap the save button on any video to start one, or create one here.
          </Text>
        }
      />

      <NameSheet
        {...LIST_NAME_FIELD}
        isVisible={isNewListSheetVisible}
        title="New list"
        submitLabel="Create"
        onSubmit={createList}
        onClose={() => setIsNewListSheetVisible(false)}
      />
      <NavigationBarScrim />
    </SafeAreaView>
  );
}

function SavedListRow({ list, onPress }: { list: SavedVideoList; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${list.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressedRow]}
    >
      <MaterialCommunityIcons name="bookmark-outline" size={22} color={colors.textPrimary} />
      <View style={styles.rowTexts}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {list.name}
        </Text>
        <Text style={styles.rowDetails}>{formatVideoCount(list.videos.length)}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.medium,
    paddingBottom: spacing.extraLarge,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    minHeight: 60,
    paddingHorizontal: spacing.medium,
    borderRadius: 12,
  },
  pressedRow: {
    backgroundColor: colors.surface,
  },
  rowTexts: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  rowDetails: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  emptyHint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    padding: spacing.medium,
  },
});
