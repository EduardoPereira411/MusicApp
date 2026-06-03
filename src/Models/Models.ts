export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumId?: string;
  artworkUrl?: string;
  duration?: number;
  clientQueueId?: string;
  trackNumber?: number;
}

export interface Album {
  id: string;
  name: string;
  artist: string;
  artworkUrl?: string;
}

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
