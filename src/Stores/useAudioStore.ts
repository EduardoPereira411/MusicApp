import { create } from "zustand";
import { AudioPlayer, setAudioModeAsync } from "expo-audio";
import MediaControl, { Command, PlaybackState } from "expo-media-control";
import { Song, QueueSong, PlaybackContext } from "@/Models/Models";
import {
  getStreamUrl,
  fetchThemeOrRandomQueue,
  getArtworkUrl,
} from "@/Services/navidromeService";
import { ToastType } from "@/Stores/useToastStore";

const generateUniqueId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

interface AudioState {
  // State variables consumed by UI
  queue: QueueSong[];
  playingSongQueueIndex: number;
  playing: boolean;
  lookAheadError: boolean;
  player: AudioPlayer | null;
  currentArtworkUrl: string | null;

  // Background context state cache
  cachedCreds: any | null;

  // Internal mutable non-reactive pools
  pools: {
    userQueue: QueueSong[];
    contextQueue: Song[];
  };
  hasUpdatedDuration: boolean;

  // Actions
  getArtworkForSong: (coverArtId: string, size: number) => string | null;
  initializePlayer: (playerInstance: AudioPlayer) => () => void;
  setCachedCreds: (authCreds: any | null) => void;
  playSongNow: (
    song: Song,
    contextSongs?: Song[],
    contextInfo?: PlaybackContext,
    showToast?: (m: string, t?: ToastType) => void,
  ) => Promise<void>;
  addToQueue: (
    song: Song,
    showToast?: (m: string, t?: ToastType) => void,
    contextInfo?: PlaybackContext,
  ) => void;
  loadSongAtIndex: (
    index: number,
    showToast?: (m: string, t?: ToastType) => void,
  ) => Promise<void>;
  playNext: (showToast?: (m: string, t?: ToastType) => void) => void;
  playPrevious: (showToast?: (m: string, t?: ToastType) => void) => void;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => void;
  removeFromQueue: (
    queueId: string,
    showToast?: (m: string, t?: ToastType) => void,
  ) => void;
  skipToSongOnQueue: (
    index: string,
    showToast?: (m: string, t?: ToastType) => void,
  ) => void;
  updateQueueOrder: (newQueue: QueueSong[]) => void;
  triggerLookAhead: (
    showToast?: (m: string, t?: ToastType) => void,
  ) => Promise<void>;
  logoutCleanUp: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  queue: [],
  playingSongQueueIndex: -1,
  playing: false,
  lookAheadError: false,
  player: null,
  currentArtworkUrl: null,
  cachedCreds: null,
  pools: { userQueue: [], contextQueue: [] },
  hasUpdatedDuration: false,

  getArtworkForSong: (coverArtId, size) => {
    const { cachedCreds } = get();
    if (!cachedCreds || !coverArtId) return null;
    return getArtworkUrl(cachedCreds, coverArtId, size);
  },

  initializePlayer: (playerInstance) => {
    set({ player: playerInstance });

    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
      shouldPlayInBackground: true,
    }).catch(() => {});

    MediaControl.enableMediaControls({
      capabilities: [
        Command.PLAY,
        Command.PAUSE,
        Command.NEXT_TRACK,
        Command.PREVIOUS_TRACK,
        Command.SEEK,
      ],
      compactCapabilities: [Command.PLAY, Command.PAUSE, Command.NEXT_TRACK],
    }).catch(() => {});

    const playbackSub = playerInstance.addListener(
      "playbackStatusUpdate",
      (statusUpdate) => {
        const state = get();
        const currentSong = state.queue[state.playingSongQueueIndex] || null;

        if (statusUpdate.didJustFinish) {
          if (state.playingSongQueueIndex < state.queue.length - 1) {
            state.loadSongAtIndex(state.playingSongQueueIndex + 1);
          } else {
            state.logoutCleanUp();
          }
        }

        if (statusUpdate.playing !== undefined) {
          if (get().playing !== statusUpdate.playing) {
            set({ playing: statusUpdate.playing });
          }
        }

        if (currentSong) {
          if (statusUpdate.currentTime !== undefined) {
            const stateValue = statusUpdate.playing
              ? PlaybackState.PLAYING
              : PlaybackState.PAUSED;
            MediaControl.updatePlaybackState(
              stateValue,
              statusUpdate.currentTime,
              statusUpdate.playing ? 1.0 : 0.0,
            ).catch(() => {});
          }

          if (
            statusUpdate.duration &&
            statusUpdate.duration > 0 &&
            !state.hasUpdatedDuration
          ) {
            set({ hasUpdatedDuration: true });

            const artworkUrl =
              currentSong.coverArt && state.cachedCreds
                ? getArtworkUrl(state.cachedCreds, currentSong.coverArt, 300)
                : null;

            set({ currentArtworkUrl: artworkUrl });

            MediaControl.updateMetadata({
              title: currentSong.title,
              artist: currentSong.artist,
              album: currentSong.album || "Navidrome Album",
              artwork: artworkUrl ? { uri: artworkUrl } : undefined,
              duration: statusUpdate.duration,
            }).catch(() => {});
          }
        }
      },
    );

    const traySub = MediaControl.addListener((event) => {
      const state = get();
      switch (event.command) {
        case Command.PLAY:
          playerInstance.play();
          break;
        case Command.PAUSE:
          playerInstance.pause();
          break;
        case Command.NEXT_TRACK:
          if (state.playingSongQueueIndex < state.queue.length - 1)
            state.loadSongAtIndex(state.playingSongQueueIndex + 1);
          break;
        case Command.PREVIOUS_TRACK:
          if (state.playingSongQueueIndex > 0)
            state.loadSongAtIndex(state.playingSongQueueIndex - 1);
          break;
        case Command.SEEK:
          const pos =
            event.data && typeof event.data.position === "number"
              ? event.data.position
              : event.data;
          if (typeof pos === "number") playerInstance.seekTo(pos);
          break;
      }
    });

    return () => {
      playbackSub.remove();
      traySub;
      MediaControl.disableMediaControls().catch(() => {});
    };
  },

  setCachedCreds: (authCreds) => {
    if (!authCreds) {
      set({ cachedCreds: null });
      return;
    }
    const currentCached = get().cachedCreds;
    const isCredentialsIdentical =
      currentCached &&
      currentCached.serverUrl === authCreds.serverUrl &&
      currentCached.username === authCreds.username &&
      currentCached.token === authCreds.token;

    if (!isCredentialsIdentical) {
      set({ cachedCreds: authCreds });
    }
  },

  loadSongAtIndex: async (index, showToast) => {
    const { queue, player, cachedCreds } = get();
    if (index < 0 || index >= queue.length || !player || !cachedCreds) return;

    const targetSong = queue[index];
    try {
      const url = getStreamUrl(cachedCreds, targetSong.id);
      if (!url) throw new Error("Endpoint construction failed.");

      const artworkUrl = targetSong.coverArt
        ? getArtworkUrl(cachedCreds, targetSong.coverArt, 300)
        : null;

      set({
        playingSongQueueIndex: index,
        lookAheadError: false,
        hasUpdatedDuration: false,
        currentArtworkUrl: artworkUrl,
      });
      player.replace({ uri: url });
      player.play();

      MediaControl.updateMetadata({
        title: targetSong.title,
        artist: targetSong.artist,
        album: targetSong.album || "Navidrome Album",
        artwork: artworkUrl ? { uri: artworkUrl } : undefined,
        duration: targetSong.duration || 0,
      }).catch(() => {});
    } catch (err: any) {
      if (showToast)
        showToast(`Playback Failed: ${err.message || err}`, "error");
    }
  },

  playSongNow: async (song, contextSongs, contextInfo, showToast) => {
    const { player, queue, playingSongQueueIndex, cachedCreds } = get();
    if (!player || !cachedCreds) return;

    if (queue[playingSongQueueIndex]?.id === song.id) {
      player.playing ? player.pause() : player.play();
      return;
    }

    try {
      const url = getStreamUrl(cachedCreds, song.id);
      if (!url) throw new Error("Failed to format media stream URL.");

      const artworkUrl = song.coverArt
        ? getArtworkUrl(cachedCreds, song.coverArt, 300)
        : null;
      const determinedContext = contextInfo || { type: "search" };
      let newQueue: QueueSong[] = [];
      const updatedPools = { userQueue: [], contextQueue: [] as Song[] };

      if (contextSongs && contextSongs.length > 0) {
        const idx = contextSongs.findIndex((s) => s.id === song.id);
        const relativeContext =
          idx !== -1 ? contextSongs.slice(idx) : contextSongs;
        const baseIndex = determinedContext.songIndex ?? 0;

        const fullyDecoratedContext = relativeContext.map((track, offset) => ({
          ...track,
          playbackContext: {
            ...determinedContext,
            songIndex: baseIndex + offset,
          },
        }));

        updatedPools.contextQueue = fullyDecoratedContext;
        newQueue = fullyDecoratedContext.slice(0, 5).map((track) => ({
          ...track,
          origin: "auto" as const,
          clientQueueId: generateUniqueId(),
        }));
      } else {
        newQueue = [
          {
            ...song,
            origin: "user" as const,
            clientQueueId: generateUniqueId(),
            playbackContext: determinedContext,
          },
        ];
      }

      set({
        queue: newQueue,
        playingSongQueueIndex: 0,
        pools: updatedPools,
        lookAheadError: false,
        hasUpdatedDuration: false,
        currentArtworkUrl: artworkUrl,
      });

      player.replace({ uri: url });
      player.play();
    } catch (err: any) {
      if (showToast)
        showToast(
          `Streaming initialization failed: ${err.message || err}`,
          "error",
        );
    }
  },

  addToQueue: (song, showToast, contextInfo) => {
    const { queue, playingSongQueueIndex, playSongNow, pools, cachedCreds } =
      get();
    const determinedContext = contextInfo || { type: "search" };

    if (!cachedCreds) return;

    const flaggedSong: QueueSong = {
      ...song,
      origin: "user",
      clientQueueId: generateUniqueId(),
      playbackContext: determinedContext,
    };

    pools.userQueue.push(flaggedSong);

    if (queue.length === 0) {
      set({ queue: [flaggedSong], lookAheadError: false });
      setTimeout(() => {
        playSongNow(flaggedSong, undefined, determinedContext).catch(() => {});
      }, 0);
      return;
    }

    const updated = [...queue];
    let insertionIndex = updated.findIndex(
      (track, i) => i > playingSongQueueIndex && track.origin === "auto",
    );
    if (insertionIndex === -1) insertionIndex = updated.length;
    updated.splice(insertionIndex, 0, flaggedSong);

    set({ queue: updated, lookAheadError: false });
    showToast?.(`Added "${song.title}" to queue`);
  },

  triggerLookAhead: async (showToast) => {
    const { queue, playingSongQueueIndex, pools, cachedCreds } = get();
    if (playingSongQueueIndex === -1 || queue.length === 0 || !cachedCreds)
      return;

    const songsRemaining = queue.length - 1 - playingSongQueueIndex;
    if (songsRemaining > 2) return;

    const totalPoolLength = pools.contextQueue.length + pools.userQueue.length;

    if (totalPoolLength > queue.length) {
      const nextRawBatch = pools.contextQueue.slice(
        queue.length,
        queue.length + 5,
      );
      const decoratedBatch = nextRawBatch.map((track) => ({
        ...track,
        origin: "auto" as const,
        clientQueueId: generateUniqueId(),
        playbackContext: (track as QueueSong).playbackContext ?? undefined,
      }));
      set({ queue: [...queue, ...decoratedBatch], lookAheadError: false });
    } else {
      const lastSong = queue[queue.length - 1];
      try {
        const nextTracks = await fetchThemeOrRandomQueue(
          cachedCreds,
          lastSong,
          5,
        );
        if (nextTracks.length > 0) {
          const flaggedTracks = nextTracks.map((track) => ({
            ...track,
            origin: "auto" as const,
            clientQueueId: generateUniqueId(),
          }));
          pools.contextQueue.push(...flaggedTracks);
          set({ queue: [...queue, ...flaggedTracks], lookAheadError: false });
        }
      } catch {
        showToast?.("Failed to fetch next automatic radio tracks", "error");
        set({ lookAheadError: true });
      }
    }
  },

  playNext: (showToast) => {
    try {
      const { queue, playingSongQueueIndex, loadSongAtIndex } = get();
      if (playingSongQueueIndex < queue.length - 1)
        loadSongAtIndex(playingSongQueueIndex + 1, showToast);
    } catch (error: any) {
      showToast?.(`Error: ${error.message}`, "error");
    }
  },

  playPrevious: (showToast) => {
    const { queue, playingSongQueueIndex, loadSongAtIndex } = get();
    if (playingSongQueueIndex > 0)
      loadSongAtIndex(playingSongQueueIndex - 1, showToast);
  },

  togglePlayPause: () => {
    const { player } = get();
    if (player) player.playing ? player.pause() : player.play();
  },

  seekTo: (seconds) => {
    const { player, queue, playingSongQueueIndex, playing } = get();
    if (!player) return;
    player.seekTo(seconds);
    if (queue[playingSongQueueIndex]) {
      const stateValue = playing ? PlaybackState.PLAYING : PlaybackState.PAUSED;
      MediaControl.updatePlaybackState(
        stateValue,
        seconds,
        playing ? 1.0 : 0.0,
      ).catch(() => {});
    }
  },

  removeFromQueue: (queueId) => {
    const { queue, pools } = get();
    const updatedQueue = queue.filter((s) => s.clientQueueId !== queueId);

    pools.userQueue = pools.userQueue.filter(
      (s) => s.clientQueueId !== queueId,
    );
    pools.contextQueue = pools.contextQueue.filter(
      (s) => s.clientQueueId !== queueId,
    );

    set({ queue: updatedQueue });
  },

  skipToSongOnQueue: (clientQueueId, showToast) => {
    const { queue, playingSongQueueIndex, loadSongAtIndex } = get();

    // Start search AFTER the currently playing song
    const searchStart = playingSongQueueIndex + 1;
    const upcomingQueue = queue.slice(searchStart);

    const relativeIndex = upcomingQueue.findIndex(
      (s) => s.clientQueueId === clientQueueId,
    );

    if (relativeIndex !== -1) {
      // Add the relative index back to the offset to get the absolute index
      loadSongAtIndex(searchStart + relativeIndex, showToast);
    }
  },

  updateQueueOrder: (newQueue) => {
    const { playingSongQueueIndex, pools } = get();
    const upcoming = newQueue.slice(playingSongQueueIndex + 1);
    pools.userQueue = upcoming.filter((s) => s.origin === "user");
    pools.contextQueue = upcoming.filter((s) => s.origin === "auto");
    set({ queue: newQueue });
  },

  logoutCleanUp: () => {
    const { player } = get();
    if (player) {
      player.replace("");
      player.pause();
    }
    set({
      queue: [],
      playingSongQueueIndex: -1,
      playing: false,
      cachedCreds: null,
      currentArtworkUrl: null,
      pools: { userQueue: [], contextQueue: [] },
    });
    MediaControl.updateMetadata({
      title: "",
      artist: "",
      album: "",
      artwork: undefined,
      duration: 0,
    }).catch(() => {});
    MediaControl.updatePlaybackState(PlaybackState.PAUSED, 0, 0.0).catch(
      () => {},
    );
  },
}));
