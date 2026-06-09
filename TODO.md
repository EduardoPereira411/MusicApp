# Features to implement

- IMplement functionality to getting similar songs, instead of random ones
- Make it so shuffle button on albums/playlists shuffles songs when clicked
- Make it so when songs end on album/playlist it doesn't recommend random songs, but either ends or repeats the album
- Create Listen Along functionality so queues can be shared with other users :)
- Optimize Screen and component re renders now that zustand has been implemented, to make app as light as possible
  - HomeScreen and Search screen headers (maybe combine both into one screen and turn search screen into download screen instead?)
- Components to Optimize
  - QueueModal and QueueTrack
  - MediaCollectionItem and perhaps SongItem
  - SongOptionsModal - Re renders everything when opened
  - DownloadSongItem and DownloadAlbumItem
  - AudioControls?
- Screens to optimize
  - Download Search and Search - maybe also find a way to merge them into one?
  - LOginScreen - Everything re renders whilst user is typing on text inputs
  - ProfileScreen - Everything re renders whilst user is typing on text inputs for the download server credentials
- Functionalities
  - Toast causes a screen wide re render, find a way to fix it
