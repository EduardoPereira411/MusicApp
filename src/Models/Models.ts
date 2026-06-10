export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumId?: string;
  coverArt?: string;
  duration?: number;
  clientQueueId?: string;
  trackNumber?: number;
}

export interface PlaybackContext {
  type: "playlist" | "album" | "artist" | "home" | "search";
  id?: string;
  songIndex?: number;
}

export interface QueueSong extends Song {
  origin: "user" | "auto";
  clientQueueId: string;
  playbackContext?: PlaybackContext;
}

export interface SharedCollectionData {
  id: string;
  name: string;
  type: "album" | "playlist" | "artist";
  subtitle?: string;
  subItemCount?: number;
  coverArt?: string;
}

export interface BaseCredentials {
  serverUrl: string;
  username?: string;
  password?: string;
}

export interface NavidromeCredentials extends BaseCredentials {}
export interface DownloadAPICredentials extends BaseCredentials {}
export interface Artist {
  id: string;
  name: string;
  albumCount?: number;
}

export interface DownloadAlbumMetadata {
  album_name: string;
  album_id: string;
  artist: string;
  release?: string;
  album_cover?: string;
  album_type?: string;
  is_explicit?: boolean;
}

export interface DownloadTrackMetadata {
  song_name: string;
  artist: string;
  album_name?: string;
  track_number?: string;
  release?: string;
  album_cover?: string;
  download_url: string;
  song_duration?: number;
  source: string;
}
