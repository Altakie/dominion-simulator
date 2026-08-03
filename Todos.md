# TODOS

## Major Features

- Maybe a reorder decision type?
- Better trash pile
- Card reveal mechanic
- Lobby's with ids
  - Can share lobby code with other players to allow joining
  - Password locked lobbies
  - Combine lobby stores and router stores
  - Make game_socket be created when the connect button is clicked
- Screen to setup game in beginning
- Actually allow player to make decisions during money phase

## Minor Features

- Server should sign client ids in case someone tries to modify them client side
  - If the client id is not server signed, reassign the client's clientid to a server assigned clientid
- Color code end screen
  - Display vp sources separately
- Indicate empty supply piles
  - Gray them out or put an x over them
  - Just do a check on whether the count is 0 and replace the supply pile visual when it is 0
- Better indication of current turn
  - Think on this
  - Highlighting of current player in player list?
  - Different border to screen???
  - Background slightly changes or flashes
  - Quick popup?
    - Easily dismissable
- Trash pile dialog pop-up button?
  - Maybe show top of trash pile
- Card Art
- AI Player
  - Lobby hosts, only the lobby host should be able to start the game, add AI players, etc..
  - This is to avoid race conditions
  - Lets make the first player who joined lobby host
  - Support for kicking players from the lobby
  - Support for multiple AI players
    - Make them get created with some sort of random name
- Make the log better?
  - Make more recent turns at the top?
  - Organize the incoming messages by turn
  - Obscure some information about what is happening to players that are not the origin player
  - Multiple consecutive messages of the same time should be squashed together / combined into one big message
  - Color code incoming messages by what information they contain
    - Cards should be color coded by type and highlighted within the message

## Bugs
