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
