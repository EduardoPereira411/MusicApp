import { useAudioStore } from "@/Stores/useAudioStore";
import { useToast } from "@/Context/ToastContext";
import { useMemo } from "react";

type AudioStoreType = ReturnType<typeof useAudioStore>;

type AudioHookState = AudioStoreType & {
  currentSong: any;
};

export function useAudio<T = AudioHookState>(
  selector?: (state: AudioHookState) => T,
): T {
  const store = useAudioStore((s) => s);
  const { showToast } = useToast();

  const queue = useAudioStore((s) => s.queue);
  const playingSongQueueIndex = useAudioStore((s) => s.playingSongQueueIndex);

  const currentSong = useMemo(() => {
    return playingSongQueueIndex >= 0 && playingSongQueueIndex < queue.length
      ? queue[playingSongQueueIndex]
      : null;
  }, [playingSongQueueIndex]);

  // Consolidate the entire state map
  const fullState = useMemo<AudioHookState>(
    () => ({
      ...store,
      currentSong,

      // Overriding the actions with your automatically injected context dependencies
      getArtworkForSong: (coverArtId: string, size: number) =>
        store.getArtworkForSong(coverArtId, size),
      playSongNow: (song: any, contextSongs?: any[], contextInfo?: any) =>
        store.playSongNow(song, contextSongs, contextInfo, showToast),

      addToQueue: (song: any, contextInfo?: any) =>
        store.addToQueue(song, showToast, contextInfo),

      loadSongAtIndex: (index: number) =>
        store.loadSongAtIndex(index, showToast),

      playNext: () => store.playNext(),

      playPrevious: () => store.playPrevious(),

      removeFromQueue: (queueId: string) => store.removeFromQueue(queueId),

      skipToSongOnQueue: (queue: string) => store.skipToSongOnQueue(queue),

      triggerLookAhead: () => store.triggerLookAhead(showToast),
    }),
    [store, currentSong, showToast],
  );

  // Execute selector optimization if passed, otherwise fall back to full state object
  return selector ? selector(fullState) : (fullState as unknown as T);
}
