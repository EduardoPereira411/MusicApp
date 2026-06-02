import * as SecureStore from "expo-secure-store";
import md5 from "md5";

const KEYS = {
  SERVER_URL: "navidrome_server_url",
  USERNAME: "navidrome_username",
  PASSWORD: "navidrome_password",
};

export interface Credentials {
  serverUrl: string;
  username: string;
  password?: string;
}

export const authStorage = {
  async saveCredentials({ serverUrl, username, password }: Credentials) {
    const cleanUrl = serverUrl.replace(/\/$/, "");
    await SecureStore.setItemAsync(KEYS.SERVER_URL, cleanUrl);
    await SecureStore.setItemAsync(KEYS.USERNAME, username);
    if (password) {
      await SecureStore.setItemAsync(KEYS.PASSWORD, password);
    }
  },

  async getCredentials(): Promise<Credentials | null> {
    const serverUrl = await SecureStore.getItemAsync(KEYS.SERVER_URL);
    const username = await SecureStore.getItemAsync(KEYS.USERNAME);
    const password = await SecureStore.getItemAsync(KEYS.PASSWORD);

    if (!serverUrl || !username || !password) return null;
    return { serverUrl, username, password };
  },

  async clearCredentials() {
    await SecureStore.deleteItemAsync(KEYS.SERVER_URL);
    await SecureStore.deleteItemAsync(KEYS.USERNAME);
    await SecureStore.deleteItemAsync(KEYS.PASSWORD);
  },
};

/**
 * Generates the required Subsonic auth query string parameters (u, t, s, v, c, f)
 * Subsonic token format: md5(password + salt)
 */
export async function getSubsonicAuthParams(): Promise<string | null> {
  const creds = await authStorage.getCredentials();
  if (!creds || !creds.password) return null;

  const salt = Math.random().toString(36).substring(2, 10);
  const token = md5(creds.password + salt);

  const params = new URLSearchParams({
    u: creds.username,
    t: token,
    s: salt,
    v: "1.16.1",
    c: "my-music-app",
    f: "json",
  });

  return params.toString();
}

export async function fetchNavidromePlaylists() {
  try {
    const creds = await authStorage.getCredentials();
    const params = await getSubsonicAuthParams();
    if (!creds || !params) return [];

    const url = `${creds.serverUrl}/rest/getPlaylists.view?${params}`;
    const response = await fetch(url);
    const data = await response.json();

    const playlists = data["subsonic-response"]?.playlists?.playlist || [];
    return Array.isArray(playlists) ? playlists : [playlists];
  } catch (e) {
    console.error("Failed to fetch playlists:", e);
    throw e;
  }
}

export async function checkSongInPlaylist(
  playlistId: string,
  songId: string,
): Promise<boolean> {
  const creds = await authStorage.getCredentials();
  const params = await getSubsonicAuthParams();
  if (!creds || !params) return false;

  const checkUrl = `${creds.serverUrl}/rest/getPlaylist.view?${params}&id=${playlistId}`;
  const checkRes = await fetch(checkUrl);
  const checkData = await checkRes.json();

  const existingTracks = checkData["subsonic-response"]?.playlist?.entry || [];
  const tracksArray = Array.isArray(existingTracks)
    ? existingTracks
    : [existingTracks];

  return tracksArray.some((track: any) => track.id === songId);
}

export async function addTrackToPlaylist(
  playlistId: string,
  songId: string,
): Promise<boolean> {
  const creds = await authStorage.getCredentials();
  const params = await getSubsonicAuthParams();
  if (!creds || !params) return false;

  const updateUrl = `${creds.serverUrl}/rest/updatePlaylist.view?${params}&playlistId=${playlistId}&songIdToAdd=${songId}`;
  const updateRes = await fetch(updateUrl);
  const updateData = await updateRes.json();

  return updateData["subsonic-response"]?.status === "ok";
}
