import * as SecureStore from "expo-secure-store";
import md5 from "md5";
import { Song, SharedCollectionData } from "@/Models/Models";
import { NavidromeCredentials } from "@/Models/Models";

const KEYS = {
  SERVER_URL: "navidrome_server_url",
  USERNAME: "navidrome_username",
  PASSWORD: "navidrome_password",
};

export const authStorage = {
  async saveCredentials({
    serverUrl,
    username,
    password,
  }: NavidromeCredentials) {
    const cleanUrl = serverUrl.replace(/\/$/, "");
    await SecureStore.setItemAsync(KEYS.SERVER_URL, cleanUrl);
    if (username) await SecureStore.setItemAsync(KEYS.USERNAME, username);
    if (password) await SecureStore.setItemAsync(KEYS.PASSWORD, password);
  },

  async getCredentials(): Promise<NavidromeCredentials | null> {
    const serverUrl = await SecureStore.getItemAsync(KEYS.SERVER_URL);
    const username =
      (await SecureStore.getItemAsync(KEYS.USERNAME)) || undefined;
    const password =
      (await SecureStore.getItemAsync(KEYS.PASSWORD)) || undefined;

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
 */
export function getSubsonicAuthParams(
  creds: NavidromeCredentials,
  size?: number,
): string | null {
  if (!creds.password || !creds.username) return null;

  const salt = Math.random().toString(36).substring(2, 10);
  const token = md5(creds.password + salt);

  const params: Record<string, string> = {
    u: creds.username,
    t: token,
    s: salt,
    v: "1.16.1",
    c: "my-music-app",
    f: "json",
  };

  if (size !== undefined) {
    params.size = size.toString();
  }

  return new URLSearchParams(params).toString();
}

export function buildSubsonicAuthParams(
  username: string,
  password: string,
): string {
  const salt = Math.random().toString(36).substring(2, 12);
  const token = md5(password + salt);

  const params = new URLSearchParams({
    u: username,
    t: token,
    s: salt,
    v: "1.16.1",
    c: "app",
    f: "json",
  });

  return params.toString();
}

/**
 * Fast synchronous tool to stitch full artwork URLs with arbitrary canvas limits.
 */
export function getArtworkUrl(
  creds: NavidromeCredentials,
  coverArtId: string | undefined,
  size: number = 100,
): string | null {
  if (!coverArtId || !creds) return null;
  const params = getSubsonicAuthParams(creds, size);
  if (!params) return null;

  return `${creds.serverUrl}/rest/getCoverArt.view?${params}&id=${coverArtId}`;
}

export async function fetchNavidromePlaylists(
  creds: NavidromeCredentials,
): Promise<SharedCollectionData[]> {
  try {
    const params = getSubsonicAuthParams(creds);
    if (!params) throw new Error("Missing username or password configuration.");

    const url = `${creds.serverUrl}/rest/getPlaylists.view?${params}`;
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`HTTP network status error: ${response.status}`);

    const data = await response.json();
    const subResponse = data["subsonic-response"];
    if (subResponse?.status === "failed") {
      throw new Error(
        subResponse.error?.message || "Subsonic api authentication failed.",
      );
    }

    const playlists = subResponse?.playlists?.playlist || [];
    const playlistsArray = Array.isArray(playlists) ? playlists : [playlists];

    return playlistsArray.map((playlist: any) => ({
      id: playlist.id,
      name: playlist.name,
      type: "playlist",
      subtitle: `By ${playlist.owner || "Unknown"}`,
      subItemCount: playlist.songCount,
      coverArt: "",
    }));
  } catch (e: any) {
    throw new Error(`Failed to fetch playlists: ${e.message || e}`);
  }
}

export async function checkSongInPlaylist(
  creds: NavidromeCredentials,
  playlistId: string,
  songId: string,
): Promise<boolean> {
  try {
    const params = getSubsonicAuthParams(creds);
    if (!params) throw new Error("Missing username or password configuration.");

    const checkUrl = `${creds.serverUrl}/rest/getPlaylist.view?${params}&id=${playlistId}`;
    const checkRes = await fetch(checkUrl);
    if (!checkRes.ok)
      throw new Error(`HTTP status code error: ${checkRes.status}`);

    const checkData = await checkRes.json();
    const subResponse = checkData["subsonic-response"];
    if (subResponse?.status === "failed") {
      throw new Error(
        subResponse.error?.message || "Subsonic server interaction failed.",
      );
    }

    const existingTracks = subResponse?.playlist?.entry || [];
    const tracksArray = Array.isArray(existingTracks)
      ? existingTracks
      : [existingTracks];

    return tracksArray.some((track: any) => track.id === songId);
  } catch (e: any) {
    throw new Error(
      `Failed while validating structural playlist state: ${e.message || e}`,
    );
  }
}

export async function addTrackToPlaylist(
  creds: NavidromeCredentials,
  playlistId: string,
  songId: string,
): Promise<boolean> {
  try {
    const params = getSubsonicAuthParams(creds);
    if (!params) throw new Error("Missing username or password configuration.");

    const updateUrl = `${creds.serverUrl}/rest/updatePlaylist.view?${params}&playlistId=${playlistId}&songIdToAdd=${songId}`;
    const updateRes = await fetch(updateUrl);
    if (!updateRes.ok)
      throw new Error(`HTTP Status Error: ${updateRes.status}`);

    const updateData = await updateRes.json();
    const subResponse = updateData["subsonic-response"];
    if (subResponse?.status === "failed") {
      throw new Error(
        subResponse.error?.message || "Could not save track to playlist.",
      );
    }

    return subResponse?.status === "ok";
  } catch (e: any) {
    throw new Error(`Playlist insertion failed: ${e.message || e}`);
  }
}

export async function fetchTracks(
  creds: NavidromeCredentials,
): Promise<Song[]> {
  try {
    const params = getSubsonicAuthParams(creds);
    if (!params) throw new Error("Missing authentication credentials.");

    const url = `${creds.serverUrl}/rest/getRandomSongs.view?${params}&size=20`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP status error: ${response.status}`);

    const data = await response.json();
    const subResponse = data["subsonic-response"];
    if (subResponse?.status === "failed") {
      throw new Error(
        subResponse.error?.message || "Subsonic application context failure.",
      );
    }

    const fetchedSongs: any[] = subResponse?.randomSongs?.song || [];
    return fetchedSongs.map((song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      albumId: song.albumId,
      coverArt: song.coverArt || song.id,
    }));
  } catch (e: any) {
    throw new Error(`Failed fetching random tracks: ${e.message || e}`);
  }
}

export async function fetchAlbums(
  creds: NavidromeCredentials,
): Promise<SharedCollectionData[]> {
  try {
    const params = getSubsonicAuthParams(creds);
    if (!params) throw new Error("Missing credentials setup context.");

    const url = `${creds.serverUrl}/rest/getAlbumList2.view?${params}&type=random&size=20`;
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`HTTP execution connection fault: ${response.status}`);

    const data = await response.json();
    const subResponse = data["subsonic-response"];
    if (subResponse?.status === "failed") {
      throw new Error(
        subResponse.error?.message || "Subsonic retrieval context fault.",
      );
    }

    const fetchedAlbums: any[] = subResponse?.albumList2?.album || [];
    return fetchedAlbums.map((album) => ({
      id: album.id,
      name: album.name,
      type: "album",
      subtitle: album.artist,
      subItemCount: album.songCount,
      coverArt: album.coverArt || album.id,
    }));
  } catch (e: any) {
    throw new Error(`Failed fetching albums list: ${e.message || e}`);
  }
}

export async function searchAll(
  creds: NavidromeCredentials,
  query: string,
): Promise<{
  songs: Song[];
  albums: SharedCollectionData[];
  artists: SharedCollectionData[];
}> {
  try {
    const params = getSubsonicAuthParams(creds);
    if (!params) throw new Error("Missing structural auth properties.");
    if (!query.trim()) return { songs: [], albums: [], artists: [] };

    const url = `${creds.serverUrl}/rest/search3.view?${params}&query=${encodeURIComponent(query)}&songCount=30&albumCount=30&artistCount=30`;
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Server connection error: ${response.status}`);

    const data = await response.json();
    const subResponse = data["subsonic-response"];
    if (subResponse?.status === "failed") {
      throw new Error(
        subResponse.error?.message || "Search index query denied.",
      );
    }

    const searchResult = subResponse?.searchResult3;

    const fetchedSongs: any[] = searchResult?.song || [];
    const songs = (Array.isArray(fetchedSongs) ? fetchedSongs : [fetchedSongs])
      .filter(Boolean)
      .map((song) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        albumId: song.albumId,
        coverArt: song.coverArt || song.id,
      }));

    const fetchedAlbums: any[] = searchResult?.album || [];
    const albums: SharedCollectionData[] = (
      Array.isArray(fetchedAlbums) ? fetchedAlbums : [fetchedAlbums]
    )
      .filter(Boolean)
      .map((album) => ({
        id: album.id,
        name: album.name,
        type: "album",
        subtitle: album.artist,
        subItemCount: album.songCount,
        coverArt: album.coverArt || album.id,
      }));

    const fetchedArtists: any[] = searchResult?.artist || [];
    const artists: SharedCollectionData[] = (
      Array.isArray(fetchedArtists) ? fetchedArtists : [fetchedArtists]
    )
      .filter(Boolean)
      .map((artist) => ({
        id: artist.id,
        name: artist.name,
        type: "artist",
        subItemCount: artist.albumCount,
        subtitle: `${artist.albumCount || 0} Albums`,
        coverArt: "",
      }));

    return { songs, albums, artists };
  } catch (e: any) {
    throw new Error(`Search index failure down stream: ${e.message || e}`);
  }
}

export async function fetchArtists(
  creds: NavidromeCredentials,
): Promise<SharedCollectionData[]> {
  try {
    const params = getSubsonicAuthParams(creds);
    if (!params) throw new Error("No active identity context token parsed.");

    const url = `${creds.serverUrl}/rest/getArtists.view?${params}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP status: ${response.status}`);

    const data = await response.json();
    const subResponse = data["subsonic-response"];
    if (subResponse?.status === "failed") {
      throw new Error(
        subResponse.error?.message || "Artists payload rejected.",
      );
    }

    const indices: any[] = subResponse?.artists?.index || [];
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
            coverArt: "",
          });
        });
      }
    });

    return fetchedArtists.slice(0, 30);
  } catch (e: any) {
    throw new Error(
      `Failed fetching artists core directory: ${e.message || e}`,
    );
  }
}

export async function fetchCollectionDetails(
  creds: NavidromeCredentials,
  id: string,
  type: "playlist" | "album" | "artist",
  fallbackName?: string,
): Promise<{ songs?: Song[]; collections?: SharedCollectionData[] }> {
  try {
    const params = getSubsonicAuthParams(creds);
    if (!params) throw new Error("Subsonic token processing aborted.");

    if (type === "artist") {
      const url = `${creds.serverUrl}/rest/getArtist.view?${params}&id=${id}&f=json`;
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP processing anomaly: ${response.status}`);

      const data = await response.json();
      const subResponse = data["subsonic-response"];
      if (subResponse?.status === "failed") {
        throw new Error(
          subResponse.error?.message || "Artist collections context blocked.",
        );
      }

      const artistData = subResponse?.artist;
      if (!artistData) return { collections: [] };

      const rawAlbums = artistData.album || [];
      const albumsArray = Array.isArray(rawAlbums) ? rawAlbums : [rawAlbums];

      const albums: SharedCollectionData[] = albumsArray.map((album: any) => ({
        id: album.id,
        name: album.name,
        type: "album",
        subtitle: album.artist || fallbackName,
        subItemCount: album.songCount,
        coverArt: album.coverArt || album.id,
      }));

      return { collections: albums };
    }

    const endpoint = type === "playlist" ? "getPlaylist.view" : "getAlbum.view";
    const url = `${creds.serverUrl}/rest/${endpoint}?${params}&id=${id}&f=json`;

    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`HTTP endpoint anomaly: ${response.status}`);

    const data = await response.json();
    const subResponse = data["subsonic-response"];
    if (subResponse?.status === "failed") {
      throw new Error(
        subResponse.error?.message || "Collection records lookup failed.",
      );
    }

    const targetData = subResponse?.[type];
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
        coverArt: track.coverArt || track.id,
      }));

    return { songs };
  } catch (error: any) {
    throw new Error(
      `Error fetching collection details for ${type}: ${error.message || error}`,
    );
  }
}

export function getStreamUrl(
  creds: NavidromeCredentials,
  songId: string,
): string | null {
  const params = getSubsonicAuthParams(creds);
  if (!params) return null;
  return `${creds.serverUrl}/rest/stream.view?${params}&id=${songId}`;
}

export async function fetchThemeOrRandomQueue(
  creds: NavidromeCredentials,
  baseSong: Song,
  size: number = 25,
): Promise<Song[]> {
  try {
    const params = getSubsonicAuthParams(creds);
    if (!params)
      throw new Error("Subsonic credentials stream parameters missing.");

    const randomResponse = await fetch(
      `${creds.serverUrl}/rest/getRandomSongs.view?${params}&size=${size}&f=json`,
    );
    if (!randomResponse.ok)
      throw new Error(`HTTP stream failure status: ${randomResponse.status}`);

    const randomData = await randomResponse.json();
    const subResponse = randomData["subsonic-response"];
    if (subResponse?.status === "failed") {
      throw new Error(
        subResponse.error?.message || "Dynamic queue generation rejected.",
      );
    }

    const fetchedTracks = subResponse?.randomSongs?.song || [];

    return fetchedTracks
      .filter((track: any) => track.id !== baseSong.id)
      .map((track: any) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        coverArt: track.coverArt || track.id,
      }));
  } catch (error: any) {
    throw new Error(
      `Failed creating dynamic context queue: ${error.message || error}`,
    );
  }
}
