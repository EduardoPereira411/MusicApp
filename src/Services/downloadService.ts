import * as SecureStore from "expo-secure-store";
import {
  AlbumTrackSearchResponse,
  DownloadAlbumMetadata,
  DownloadAPICredentials,
  DownloadTrackMetadata,
} from "@/Models/Models";

const DOWNLOAD_KEYS = {
  BASE_URL: "dl_api_base_url",
  USER: "dl_api_user",
  PASS: "dl_api_pass",
};

export const downloadAuthStorage = {
  async saveCredentials({
    serverUrl,
    username,
    password,
  }: DownloadAPICredentials) {
    const cleanUrl = serverUrl.replace(/\/$/, "");
    await SecureStore.setItemAsync(DOWNLOAD_KEYS.BASE_URL, cleanUrl);
    if (username) await SecureStore.setItemAsync(DOWNLOAD_KEYS.USER, username);
    if (password) await SecureStore.setItemAsync(DOWNLOAD_KEYS.PASS, password);
  },

  async getCredentials(): Promise<DownloadAPICredentials | null> {
    const serverUrl = await SecureStore.getItemAsync(DOWNLOAD_KEYS.BASE_URL);
    const username =
      (await SecureStore.getItemAsync(DOWNLOAD_KEYS.USER)) || undefined;
    const password =
      (await SecureStore.getItemAsync(DOWNLOAD_KEYS.PASS)) || undefined;

    if (!serverUrl) return null;
    return { serverUrl, username, password };
  },

  async clearCredentials() {
    await SecureStore.deleteItemAsync(DOWNLOAD_KEYS.USER);
    await SecureStore.deleteItemAsync(DOWNLOAD_KEYS.PASS);
  },
};

/**
 * Synchronously forms execution objects via memory contexts.
 * Bypasses file storage lookups during networking updates.
 */
export function buildRequestConfig(creds: DownloadAPICredentials): {
  headers: HeadersInit;
  baseUrl: string;
} {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (creds.username && creds.password) {
    const encodedCredentials = btoa(`${creds.username}:${creds.password}`);
    headers["Authorization"] = `Basic ${encodedCredentials}`;
  }

  return { headers, baseUrl: creds.serverUrl };
}
export const downloadService = {
  async searchSongs(
    creds: DownloadAPICredentials,
    query: string,
  ): Promise<DownloadTrackMetadata[]> {
    try {
      const config = buildRequestConfig(creds);
      const response = await fetch(`${config.baseUrl}/search/song`, {
        method: "POST",
        headers: config.headers,
        body: JSON.stringify({ query }),
      });
      if (!response.ok)
        throw new Error(`Server responded with code ${response.status}`);
      const data = await response.json();

      const rawResults = data.results || [];
      return rawResults.map((track: any) => ({
        song_name: track.title || track.song_name,
        artists: track.artists || [],
        video_id: track.videoId || track.video_id,
        album_name: track.album_name || "Unknown Album",
        album_id: track.album_id || "N/A",
        song_duration: track.duration_seconds || track.song_duration || 0,
        album_cover: track.album_cover || "",
        is_explicit: track.is_explicit || false,
        track_number: track.track_number || "N/A",
        release: track.release || "1900",
        source: "ytmusic",
      }));
    } catch (error: any) {
      throw new Error(
        `Failed downloading song search results: ${error.message || error}`,
      );
    }
  },

  async searchVideos(
    creds: DownloadAPICredentials,
    query: string,
  ): Promise<DownloadTrackMetadata[]> {
    try {
      const config = buildRequestConfig(creds);
      const response = await fetch(`${config.baseUrl}/search/video`, {
        method: "POST",
        headers: config.headers,
        body: JSON.stringify({ query }),
      });
      if (!response.ok)
        throw new Error(`Server responded with code ${response.status}`);
      const data = await response.json();

      const rawResults = data.results || [];
      return rawResults.map((track: any) => ({
        song_name: track.title || track.song_name,
        artists: track.artists || [],
        video_id: track.videoId || track.video_id,
        album_name: track.album_name || "Unknown Album",
        album_id: track.album_id || "N/A",
        song_duration: track.duration_seconds || track.song_duration || 0,
        album_cover: track.album_cover || "",
        is_explicit: track.is_explicit || false,
        track_number: track.track_number || "N/A",
        release: track.release || "1900",
        source: "ytmusic",
      }));
    } catch (error: any) {
      throw new Error(
        `Failed downloading video search results: ${error.message || error}`,
      );
    }
  },

  async searchAlbums(
    creds: DownloadAPICredentials,
    query: string,
  ): Promise<DownloadAlbumMetadata[]> {
    try {
      const config = buildRequestConfig(creds);
      const response = await fetch(`${config.baseUrl}/search/album`, {
        method: "POST",
        headers: config.headers,
        body: JSON.stringify({ query }),
      });
      if (!response.ok)
        throw new Error(`Server responded with code ${response.status}`);
      const data = await response.json();

      const rawResults = data.results || [];
      return rawResults.map((album: any) => ({
        album_name: album.title || album.album_name,
        album_id: album.browseId || album.album_id,
        artists: album.artists || [],
        release: album.year || album.release || "1900",
        album_cover: album.album_cover || "",
        album_type: album.type || album.album_type || "Album",
        is_explicit: album.is_explicit || false,
      }));
    } catch (error: any) {
      throw new Error(
        `Failed downloading album search results: ${error.message || error}`,
      );
    }
  },

  async getAlbumTracks(
    creds: DownloadAPICredentials,
    browseId: string,
  ): Promise<{ status: string; results: AlbumTrackSearchResponse[] }> {
    try {
      const config = buildRequestConfig(creds);
      const response = await fetch(`${config.baseUrl}/search/album_tracks`, {
        method: "POST",
        headers: config.headers,
        body: JSON.stringify({ browseId }),
      });
      if (!response.ok)
        throw new Error(`Server responded with code ${response.status}`);
      return await response.json();
    } catch (error: any) {
      throw new Error(
        `Failed executing /search/album_tracks for ${browseId}: ${error.message || error}`,
      );
    }
  },
  async downloadAlbum(
    creds: DownloadAPICredentials,
    browseId: string,
  ): Promise<{ status: string; task_id: string }> {
    try {
      const config = buildRequestConfig(creds);
      const response = await fetch(`${config.baseUrl}/download/album`, {
        method: "POST",
        headers: config.headers,
        body: JSON.stringify({ browseId }),
      });
      if (!response.ok)
        throw new Error(`Server responded with code ${response.status}`);
      return await response.json();
    } catch (error: any) {
      throw new Error(
        `Failed to trigger album download: ${error.message || error}`,
      );
    }
  },

  async downloadTrack(
    creds: DownloadAPICredentials,
    track: any,
    autocomplete: boolean = false,
    getLyrics: boolean = false,
  ): Promise<{ status: string; task_id: string }> {
    try {
      const config = buildRequestConfig(creds);

      const payload = {
        title: track.song_name,
        artists: Array.isArray(track.artists)
          ? track.artists
          : [track.artist || "Unknown Artist"],
        videoId: track.video_id || track.videoId,
        duration_seconds: track.song_duration || 0,
        album: {
          name: track.album_name || "Unknown Album",
          id: track.album_id || "N/A",
        },
        thumbnails: track.album_cover ? [{ url: track.album_cover }] : [],
        isExplicit: track.is_explicit || false,
        track_number: track.track_number || "N/A",
        release: track.release || "1900",
        isrc: track.isrc || null,
        autocomplete: autocomplete,
        get_lyrics: getLyrics,
      };

      const response = await fetch(`${config.baseUrl}/download/track`, {
        method: "POST",
        headers: config.headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok)
        throw new Error(`Server responded with code ${response.status}`);
      return await response.json();
    } catch (error: any) {
      throw new Error(
        `Failed to trigger track download: ${error.message || error}`,
      );
    }
  },

  async getTaskProgress(
    creds: DownloadAPICredentials,
    taskId: string,
  ): Promise<any> {
    try {
      const config = buildRequestConfig(creds);
      const response = await fetch(`${config.baseUrl}/tasks/${taskId}`, {
        method: "GET",
        headers: config.headers,
      });
      if (!response.ok)
        throw new Error(`Server responded with code ${response.status}`);
      return await response.json();
    } catch (error: any) {
      throw new Error(
        `Failed to fetch task progress for ${taskId}: ${error.message || error}`,
      );
    }
  },
};
