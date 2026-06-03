import * as SecureStore from "expo-secure-store";

const DOWNLOAD_KEYS = {
  BASE_URL: "dl_api_base_url",
  USER: "dl_api_user",
  PASS: "dl_api_pass",
};

export interface DownloadApiCredentials {
  baseUrl: string;
  user?: string;
  pass?: string;
}

export const downloadAuthStorage = {
  async saveCredentials({ baseUrl, user, pass }: DownloadApiCredentials) {
    const cleanUrl = baseUrl.replace(/\/$/, "");
    await SecureStore.setItemAsync(DOWNLOAD_KEYS.BASE_URL, cleanUrl);
    if (user) await SecureStore.setItemAsync(DOWNLOAD_KEYS.USER, user);
    if (pass) await SecureStore.setItemAsync(DOWNLOAD_KEYS.PASS, pass);
  },

  async getCredentials(): Promise<DownloadApiCredentials | null> {
    const baseUrl = await SecureStore.getItemAsync(DOWNLOAD_KEYS.BASE_URL);
    const user =
      (await SecureStore.getItemAsync(DOWNLOAD_KEYS.USER)) || undefined;
    const pass =
      (await SecureStore.getItemAsync(DOWNLOAD_KEYS.PASS)) || undefined;

    if (!baseUrl) return null;
    return { baseUrl, user, pass };
  },

  async clearCredentials() {
    await SecureStore.deleteItemAsync(DOWNLOAD_KEYS.BASE_URL);
    await SecureStore.deleteItemAsync(DOWNLOAD_KEYS.USER);
    await SecureStore.deleteItemAsync(DOWNLOAD_KEYS.PASS);
  },
};

// Helper to build headers including Basic Auth dynamically
async function getHeaders(): Promise<{
  headers: HeadersInit;
  baseUrl: string;
} | null> {
  const creds = await downloadAuthStorage.getCredentials();
  if (!creds) return null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (creds.user && creds.pass) {
    const encodedCredentials = btoa(`${creds.user}:${creds.pass}`);
    headers["Authorization"] = `Basic ${encodedCredentials}`;
  }

  return { headers, baseUrl: creds.baseUrl };
}

export const downloadService = {
  /**
   * POST /song_search
   * Search for songs on YTMusic
   */
  async searchSongs(query: string): Promise<any[]> {
    try {
      const config = await getHeaders();
      if (!config) return [];

      const response = await fetch(`${config.baseUrl}/song_search`, {
        method: "POST",
        headers: config.headers,
        body: JSON.stringify({ query }),
      });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Failed downloading song search results:", error);
      return [];
    }
  },

  /**
   * POST /video_search
   * Search for videos/music videos on YTMusic
   */
  async searchVideos(query: string): Promise<any[]> {
    try {
      const config = await getHeaders();
      if (!config) return [];

      const response = await fetch(`${config.baseUrl}/video_search`, {
        method: "POST",
        headers: config.headers,
        body: JSON.stringify({ query }),
      });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Failed downloading video search results:", error);
      return [];
    }
  },

  /**
   * POST /album_search
   * Search for albums on YTMusic
   */
  async searchAlbums(query: string): Promise<any[]> {
    try {
      const config = await getHeaders();
      if (!config) return [];

      const response = await fetch(`${config.baseUrl}/album_search`, {
        method: "POST",
        headers: config.headers,
        body: JSON.stringify({ query }),
      });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Failed downloading album search results:", error);
      return [];
    }
  },

  /**
   * POST /album_tracks
   * Fetches metadata for items within an album or dispatches a full album download.
   */
  async getAlbumTracks(
    browseId: string,
    download: boolean = false,
  ): Promise<any | null> {
    try {
      const config = await getHeaders();
      if (!config) return null;

      const response = await fetch(`${config.baseUrl}/album_tracks`, {
        method: "POST",
        headers: config.headers,
        body: JSON.stringify({ browseId, download }),
      });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Failed executing /album_tracks for ${browseId}:`, error);
      return null;
    }
  },

  /**
   * POST /download
   * Triggers a single track download process.
   */
  async downloadTrack(
    track: any,
  ): Promise<{ status: string; task_id: string } | null> {
    try {
      const config = await getHeaders();
      if (!config) return null;

      const response = await fetch(`${config.baseUrl}/download`, {
        method: "POST",
        headers: config.headers,
        body: JSON.stringify(track),
      });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      return await response.json(); // Returns { status: "accepted", task_id: "..." }
    } catch (error) {
      console.error("Failed to trigger track download:", error);
      return null;
    }
  },

  /**
   * GET /tasks/<task_id>
   * Polls progress metrics for active download pipelines.
   */
  async getTaskProgress(taskId: string): Promise<{
    task_id: string;
    album: string;
    status: string;
    progress: string;
    percent_complete: number;
    summary: any[];
  } | null> {
    try {
      const config = await getHeaders();
      if (!config) return null;

      const response = await fetch(`${config.baseUrl}/tasks/${taskId}`, {
        method: "GET",
        headers: config.headers,
      });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch task progress for ${taskId}:`, error);
      return null;
    }
  },
};
