import * as SecureStore from "expo-secure-store";
import { DownloadAPICredentials } from "@/Models/Models";

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
  ): Promise<any[]> {
    try {
      const config = buildRequestConfig(creds);

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

  async searchVideos(
    creds: DownloadAPICredentials,
    query: string,
  ): Promise<any[]> {
    try {
      const config = buildRequestConfig(creds);

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

  async searchAlbums(
    creds: DownloadAPICredentials,
    query: string,
  ): Promise<any[]> {
    try {
      const config = buildRequestConfig(creds);

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

  async getAlbumTracks(
    creds: DownloadAPICredentials,
    browseId: string,
    download: boolean = false,
  ): Promise<any | null> {
    try {
      const config = buildRequestConfig(creds);

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

  async downloadTrack(
    creds: DownloadAPICredentials,
    track: any,
  ): Promise<{ status: string; task_id: string } | null> {
    try {
      const config = buildRequestConfig(creds);

      const response = await fetch(`${config.baseUrl}/download`, {
        method: "POST",
        headers: config.headers,
        body: JSON.stringify(track),
      });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to trigger track download:", error);
      return null;
    }
  },

  async getTaskProgress(
    creds: DownloadAPICredentials,
    taskId: string,
  ): Promise<any | null> {
    try {
      const config = buildRequestConfig(creds);

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
