import { useAudioStore } from "@/Stores/useAudioStore";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useMemo } from "react";
import { getArtworkUrl } from "@/Services/navidromeService";

type AudioStoreType = ReturnType<typeof useAudioStore>;

type AudioHookState = AudioStoreType & {
  currentSong: any;
  currentArtworkUrl: string | null;
};

export function useAudio<T = AudioHookState>(
  selector?: (state: AudioHookState) => T,
): T {
  const store = useAudioStore();
  const { navidromeCreds } = useAuth();
  const { showToast } = useToast();

  const currentSong = useMemo(() => {
    return store.playingSongQueueIndex >= 0 &&
      store.playingSongQueueIndex < store.queue.length
      ? store.queue[store.playingSongQueueIndex]
      : null;
  }, [store.playingSongQueueIndex, store.queue]);

  const currentArtworkUrl = useMemo(() => {
    if (!navidromeCreds || !currentSong?.coverArt) return null;
    return getArtworkUrl(navidromeCreds, currentSong.coverArt, 300);
  }, [navidromeCreds, currentSong]);

  // Consolidate the entire state map
  const fullState = useMemo<AudioHookState>(
    () => ({
      ...store,
      currentSong,
      currentArtworkUrl,

      // Overriding the actions with your automatically injected context dependencies
      playSongNow: (song: any, contextSongs?: any[], contextInfo?: any) =>
        store.playSongNow(song, contextSongs, contextInfo, showToast),

      addToQueue: (song: any, contextInfo?: any) =>
        store.addToQueue(song, showToast, contextInfo),

      loadSongAtIndex: (index: number) =>
        store.loadSongAtIndex(index, showToast),

      playNext: () => store.playNext(),

      playPrevious: () => store.playPrevious(),

      removeFromQueue: (index: number) => store.removeFromQueue(index),

      skipToQueueIndex: (index: number) => store.skipToQueueIndex(index),

      triggerLookAhead: () => store.triggerLookAhead(showToast),
    }),
    [store, currentSong, currentArtworkUrl, navidromeCreds, showToast],
  );

  // Execute selector optimization if passed, otherwise fall back to full state object
  return selector ? selector(fullState) : (fullState as unknown as T);
}
