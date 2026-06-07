# Features to implement

- IMplement functionality to getting similar songs, instead of random ones
- Make it so shuffle button on albums/playlists shuffles songs when clicked
- Make it so when songs end on album/playlist it doesn't recommend random songs, but either ends or repeats the album
- Create Listen Along functionality so queues can be shared with other users :)
- Optimize Screen and component re renders now that zustand has been implemented, to make app as light as possible
  - HomeScreen and Search screen headers (maybe combine both into one screen and turn search screen into download screen instead?)
  - Remove song albums and such dependencies from HomeScreen to prevent whole re render of screen? (it's expensive)
