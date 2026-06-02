import { authStorage, getSubsonicAuthParams } from "./subsonicAuth";

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
