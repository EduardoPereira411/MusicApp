import * as SecureStore from "expo-secure-store";
import md5 from "md5";
import { Song, SharedCollectionData } from "@/Models/Models";

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
    const username = (await SecureStore.getItemAsync(KEYS.USERNAME)) || "";
    const password = (await SecureStore.getItemAsync(KEYS.PASSWORD)) || "";

    if (!serverUrl) return null;
    return { serverUrl, username, password };
  },

  async clearCredentials() {
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

export async function fetchNavidromePlaylists(): Promise<
  SharedCollectionData[]
> {
  try {
    const creds = await authStorage.getCredentials();
    const params = await getSubsonicAuthParams();
    if (!creds || !params) return [];

    const url = `${creds.serverUrl}/rest/getPlaylists.view?${params}`;
    const response = await fetch(url);
    const data = await response.json();

    const playlists = data["subsonic-response"]?.playlists?.playlist || [];
    const playlistsArray = Array.isArray(playlists) ? playlists : [playlists];

    return playlistsArray.map((playlist: any) => ({
      id: playlist.id,
      name: playlist.name,
      type: "playlist",
      subtitle: `By ${playlist.owner || "Unknown"}`,
      subItemCount: playlist.songCount,
      artworkUrl: "",
    }));
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

export async function fetchAlbums(): Promise<SharedCollectionData[]> {
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
      type: "album",
      subtitle: album.artist,
      subItemCount: album.songCount,
      artworkUrl: `${creds.serverUrl}/rest/getCoverArt.view?${params}&id=${album.coverArt || album.id}&size=300`,
    }));
  } catch (e) {
    console.error("Failed fetching albums:", e);
    return [];
  }
}

export async function searchAll(query: string): Promise<{
  songs: Song[];
  albums: SharedCollectionData[];
  artists: SharedCollectionData[];
}> {
  try {
    const creds = await authStorage.getCredentials();
    const params = await getSubsonicAuthParams();
    if (!creds || !params || !query.trim())
      return { songs: [], albums: [], artists: [] };

    const url = `${creds.serverUrl}/rest/search3.view?${params}&query=${encodeURIComponent(query)}&songCount=30&albumCount=30&artistCount=30`;
    const response = await fetch(url);
    const data = await response.json();
    const searchResult = data["subsonic-response"]?.searchResult3;

    // Parse Songs
    const fetchedSongs: any[] = searchResult?.song || [];
    const songs = (
      Array.isArray(fetchedSongs) ? fetchedSongs : [fetchedSongs]
    ).map((song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      albumId: song.albumId,
      artworkUrl: `${creds.serverUrl}/rest/getCoverArt.view?${params}&id=${song.coverArt || song.id}&size=300`,
    }));

    // Parse Albums
    const fetchedAlbums: any[] = searchResult?.album || [];
    const albums: SharedCollectionData[] = (
      Array.isArray(fetchedAlbums) ? fetchedAlbums : [fetchedAlbums]
    ).map((album) => ({
      id: album.id,
      name: album.name,
      type: "album",
      subtitle: album.artist,
      subItemCount: album.songCount,
      artworkUrl: `${creds.serverUrl}/rest/getCoverArt.view?${params}&id=${album.coverArt || album.id}&size=300`,
    }));

    const fetchedArtists: any[] = searchResult?.artist || [];
    const artists: SharedCollectionData[] = (
      Array.isArray(fetchedArtists) ? fetchedArtists : [fetchedArtists]
    ).map((artist) => ({
      id: artist.id,
      name: artist.name,
      type: "artist",
      subItemCount: artist.albumCount,
      subtitle: `${artist.albumCount || 0} Albums`,
      artworkUrl: "",
    }));

    return { songs, albums, artists };
  } catch (e) {
    console.error("Search API service failure:", e);
    return { songs: [], albums: [], artists: [] };
  }
}

export async function fetchArtists(): Promise<SharedCollectionData[]> {
  try {
    const creds = await authStorage.getCredentials();
    const params = await getSubsonicAuthParams();
    if (!creds || !params) return [];

    const url = `${creds.serverUrl}/rest/getArtists.view?${params}`;
    const response = await fetch(url);
    const data = await response.json();

    const indices: any[] = data["subsonic-response"]?.artists?.index || [];
    const fetchedArtists: SharedCollectionData[] = [];

    indices.forEach((index) => {
      if (index.artist) {
        index.artist.forEach((art: any) => {
          fetchedArtists.push({
            id: art.id,
            name: art.name,
            type: "artist",
            subItemCount: art.albumCount,
            subtitle: `${art.albumCount || 0} Albums`,
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

export async function fetchCollectionDetails(
  id: string,
  type: "playlist" | "album" | "artist",
  fallbackName?: string,
): Promise<{ songs?: Song[]; collections?: SharedCollectionData[] }> {
  try {
    const creds = await authStorage.getCredentials();
    const params = await getSubsonicAuthParams();
    if (!creds || !params) return {};

    if (type === "artist") {
      const url = `${creds.serverUrl}/rest/getArtist.view?${params}&id=${id}&f=json`;
      const response = await fetch(url);
      const data = await response.json();

      const artistData = data["subsonic-response"]?.artist;
      if (!artistData) return { collections: [] };

      const rawAlbums = artistData.album || [];
      const albumsArray = Array.isArray(rawAlbums) ? rawAlbums : [rawAlbums];

      const albums: SharedCollectionData[] = albumsArray.map((album: any) => ({
        id: album.id,
        name: album.name,
        type: "album",
        subtitle: album.artist || fallbackName,
        subItemCount: album.songCount,
        artworkUrl: `${creds.serverUrl}/rest/getCoverArt.view?${params}&id=${album.coverArt || album.id}&size=300`,
      }));

      return { collections: albums };
    }

    const endpoint = type === "playlist" ? "getPlaylist.view" : "getAlbum.view";
    const url = `${creds.serverUrl}/rest/${endpoint}?${params}&id=${id}&f=json`;

    const response = await fetch(url);
    const data = await response.json();

    const targetData = data["subsonic-response"]?.[type];
    if (!targetData) return { songs: [] };

    const rawTracks = targetData.entry || targetData.song || [];
    const tracksArray = Array.isArray(rawTracks) ? rawTracks : [rawTracks];

    const songs: Song[] = tracksArray
      .filter((track: any) => track && track.id)
      .map((track: any) => ({
        id: track.id,
        title: track.title || "Unknown Title",
        artist: track.artist || "Unknown Artist",
        album: track.album || fallbackName || "",
        albumId: track.albumId || id,
        artworkUrl: `${creds.serverUrl}/rest/getCoverArt.view?${params}&id=${track.coverArt || track.id}&size=150`,
      }));

    return { songs };
  } catch (error) {
    console.error(
      `[navidromeService] Error fetching collection details for ${type} with ID ${id}:`,
      error,
    );
    throw error;
  }
}

/**
 * Generates the full stream link for a given song ID
 */
export async function getStreamUrl(songId: string): Promise<string | null> {
  try {
    const creds = await authStorage.getCredentials();
    const params = await getSubsonicAuthParams();
    if (!creds || !params) return null;
    return `${creds.serverUrl}/rest/stream.view?${params}&id=${songId}`;
  } catch (e) {
    console.error("Error generating stream link:", e);
    return null;
  }
}

/**
 * Dynamically generates recommended queue tracks from Navidrome
 */
export async function fetchThemeOrRandomQueue(
  baseSong: Song,
  size: number = 25,
): Promise<Song[]> {
  try {
    const creds = await authStorage.getCredentials();
    const params = await getSubsonicAuthParams();
    if (!creds || !params) return [];

    let fetchedTracks: any[] = [];

    // Getting similar songs request (disabled for now since similar songs are not configured on server)
    //const similarResponse = await fetch(
    //  `${creds.serverUrl}/rest/getSimilarSongs2.view?${params}&id=${baseSong.id}&count=25&f=json`,
    //);
    //const similarData = await similarResponse.json();
    //fetchedTracks =
    //  similarData["subsonic-response"]?.similarSongs?.song || [];

    // Fetch random songs to build a queue
    //if (fetchedTracks.length === 0) {
    // Fetch random songs to build a queue
    const randomResponse = await fetch(
      `${creds.serverUrl}/rest/getRandomSongs.view?${params}&size=${size}&f=json`,
    );
    const randomData = await randomResponse.json();
    fetchedTracks = randomData["subsonic-response"]?.randomSongs?.song || [];

    return fetchedTracks
      .filter((track: any) => track.id !== baseSong.id) // Avoid duplicate songs
      .map((track: any) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        artworkUrl: track.coverArt
          ? `${creds.serverUrl}/rest/getCoverArt.view?${params}&id=${track.coverArt}`
          : undefined,
      }));
  } catch (error) {
    console.error("Failed creating dynamic context queue:", error);
    return [];
  }
}
