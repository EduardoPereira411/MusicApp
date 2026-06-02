import * as SecureStore from "expo-secure-store";
import md5 from "md5";
import { Song } from "@/Components/SongItem";
import { Album } from "@/Components/AlbumItem";
import { Artist } from "@/Components/ArtistItem";

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

export async function fetchTracks(): Promise<Song[]> {
  try {
    const creds = await authStorage.getCredentials();
    const params = await getSubsonicAuthParams();
    if (!creds || !params) return [];

    const url = `${creds.serverUrl}/rest/getRandomSongs.view?${params}&size=20`;
    const response = await fetch(url);
    const data = await response.json();
    const fetchedSongs: any[] =
      data["subsonic-response"]?.randomSongs?.song || [];

    return fetchedSongs.map((song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      albumId: song.albumId,
      artworkUrl: `${creds.serverUrl}/rest/getCoverArt.view?${params}&id=${song.coverArt || song.id}&size=300`,
    }));
  } catch (e) {
    console.error("Failed fetching tracks:", e);
    return [];
  }
}

export async function fetchAlbums(): Promise<Album[]> {
  try {
    const creds = await authStorage.getCredentials();
    const params = await getSubsonicAuthParams();
    if (!creds || !params) return [];

    const url = `${creds.serverUrl}/rest/getAlbumList2.view?${params}&type=random&size=20`;
    const response = await fetch(url);
    const data = await response.json();
    const fetchedAlbums: any[] =
      data["subsonic-response"]?.albumList2?.album || [];

    return fetchedAlbums.map((album) => ({
      id: album.id,
      name: album.name,
      artist: album.artist,
      artworkUrl: `${creds.serverUrl}/rest/getCoverArt.view?${params}&id=${album.coverArt || album.id}&size=300`,
    }));
  } catch (e) {
    console.error("Failed fetching albums:", e);
    return [];
  }
}

export async function fetchArtists(): Promise<Artist[]> {
  try {
    const creds = await authStorage.getCredentials();
    const params = await getSubsonicAuthParams();
    if (!creds || !params) return [];

    const url = `${creds.serverUrl}/rest/getArtists.view?${params}`;
    const response = await fetch(url);
    const data = await response.json();

    const indices: any[] = data["subsonic-response"]?.artists?.index || [];
    const fetchedArtists: Artist[] = [];

    indices.forEach((index) => {
      if (index.artist) {
        index.artist.forEach((art: any) => {
          fetchedArtists.push({
            id: art.id,
            name: art.name,
            albumCount: art.albumCount,
          });
        });
      }
    });

    return fetchedArtists.slice(0, 30);
  } catch (e) {
    console.error("Failed fetching artists:", e);
    return [];
  }
}

export async function fetchPlaylistOrAlbumDetails(
  id: string,
  type: "playlist" | "album",
  fallbackName?: string,
): Promise<Song[]> {
  try {
    const creds = await authStorage.getCredentials();
    const params = await getSubsonicAuthParams();
    if (!creds || !params) return [];

    const endpoint = type === "playlist" ? "getPlaylist.view" : "getAlbum.view";
    const url = `${creds.serverUrl}/rest/${endpoint}?${params}&id=${id}&f=json`;

    const response = await fetch(url);
    const data = await response.json();

    const targetData = data["subsonic-response"]?.[type];
    if (!targetData) return [];

    const rawTracks = targetData.entry || targetData.song || [];
    const tracksArray = Array.isArray(rawTracks) ? rawTracks : [rawTracks];

    return tracksArray
      .filter((track: any) => track && track.id)
      .map((track: any) => ({
        id: track.id,
        title: track.title || "Unknown Title",
        artist: track.artist || "Unknown Artist",
        album: track.album || fallbackName || "",
        albumId: track.albumId || id,
        artworkUrl: `${creds.serverUrl}/rest/getCoverArt.view?${params}&id=${track.coverArt || track.id}&size=150`,
      }));
  } catch (error) {
    console.error(
      `[navidromeService] Error fetching ${type} details for ID ${id}:`,
      error,
    );
    throw error;
  }
}
