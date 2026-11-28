import { Text, View } from 'react-native';

import { SheetOption } from '@/components/SheetOption';
import {
  useSavedVideoLists,
  type VideoChannel,
} from '@/features/savedLists/SavedVideoListsProvider';
import { isVideoInList, type SavedVideoList } from '@/features/savedLists/savedVideoLists';
import type { ChannelVideo } from '@/features/videos/channelVideo';
import { SaveTargetOption, formatVideoCount } from '@/features/videos/components/SaveTargetOption';
import { saveSheetStyles } from '@/features/videos/components/saveSheetStyles';

type SavedListsSectionProps = {
  video: ChannelVideo;
  channel: VideoChannel;
  onCreateList: () => void;
};

/** The user's own lists in the save sheet: free and instant, and tapping again removes. */
export function SavedListsSection({ video, channel, onCreateList }: SavedListsSectionProps) {
  const { library, addVideoToList, removeVideoFromList } = useSavedVideoLists();

  function toggleVideoInList(list: SavedVideoList) {
    if (isVideoInList(list, video.videoId)) {
      removeVideoFromList(list.id, video.videoId);
    } else {
      addVideoToList(list.id, video, channel);
    }
  }

  return (
    <View style={saveSheetStyles.section}>
      <Text style={saveSheetStyles.sectionTitle}>Your lists</Text>
      {library.lists.map((list) => (
        <SaveTargetOption
          key={list.id}
          iconName="bookmark-outline"
          title={list.name}
          details={formatVideoCount(list.videos.length)}
          status={isVideoInList(list, video.videoId) ? 'saved' : 'notSaved'}
          canUnsave
          onPress={() => toggleVideoInList(list)}
        />
      ))}
      <SheetOption
        iconName="bookmark-plus-outline"
        label="New list…"
        tone="accent"
        onPress={onCreateList}
      />
    </View>
  );
}
