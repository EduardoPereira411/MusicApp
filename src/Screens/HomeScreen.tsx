import { useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAudioStore } from "@/Stores/useAudioStore";
import { useSongOptionsStore } from "@/Stores/useSongOptionsStore";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { Song } from "@/Models/Models";
import { SongOptionsModal } from "@/Components/Modals/SongOptionsModal";
import {
  SectionHeader,
  SectionHeaderVisibilityContainer,
} from "@/Components/Headers/TopBarSectionSelector";
import { HomepageList } from "@/Components/ItemLists/HomePageList";

export const HOME_PLAYBACK_CONTEXT = { type: "home" as const };

export default function HomeScreen() {
  const { navidromeCreds } = useAuth();
  const { showToast } = useToast();

  const storePlaySongNow = useAudioStore((state) => state.playSongNow);
  const storeAddToQueue = useAudioStore((state) => state.addToQueue);

  const handlePlaySongNow = useCallback(
    async (song: Song, contextSongs?: Song[]) => {
      try {
        const songContext = contextSongs || [song];
        await storePlaySongNow(song, songContext, { type: "home" }, showToast);
      } catch {}
    },
    [storePlaySongNow, showToast],
  );

  const handleSwipeAddToQueue = useCallback(
    (song: Song) => {
      storeAddToQueue(song, showToast, {
        type: "home",
        songIndex: 0,
      });
    },
    [storeAddToQueue, showToast],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Dashboard Feed</Text>

      <SectionHeader />

      <View style={styles.screenWrapper}>
        <SectionHeaderVisibilityContainer targetSection="tracks">
          <HomepageList
            activeSection="tracks"
            navidromeCreds={navidromeCreds}
            onPlay={handlePlaySongNow}
            onSwipe={handleSwipeAddToQueue}
            context={HOME_PLAYBACK_CONTEXT}
          />
        </SectionHeaderVisibilityContainer>

        <SectionHeaderVisibilityContainer targetSection="albums">
          <HomepageList
            activeSection="albums"
            navidromeCreds={navidromeCreds}
            onPlay={handlePlaySongNow}
            onSwipe={handleSwipeAddToQueue}
            context={HOME_PLAYBACK_CONTEXT}
          />
        </SectionHeaderVisibilityContainer>

        <SectionHeaderVisibilityContainer targetSection="artists">
          <HomepageList
            activeSection="artists"
            navidromeCreds={navidromeCreds}
            onPlay={handlePlaySongNow}
            onSwipe={handleSwipeAddToQueue}
            context={HOME_PLAYBACK_CONTEXT}
          />
        </SectionHeaderVisibilityContainer>
      </View>

      <SongOptionsModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  header: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  screenWrapper: {
    flex: 1,
  },
});
