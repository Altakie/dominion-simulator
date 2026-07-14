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

- Show who waiting for during attacks
  - Send the attack index over to the client and display it somewhere
- Move turn information (actions, money, and buys) visually closer to where the player's eyes are spending the most time
  - Probably between the hand and the supply
- Show top card of discard pile and how many cards are in discard pile and deck
  - Rework the update message to not send all player information
  - Update message should send
    - VP of all players
    - Top card of discard pile
    - Number of cards in discard pile
    - Number of cards in deck (draw pile)
- Show who actually wins
  - Tie breakers when vp is the same, later player should be the winner
  - Can just send who won in the message
  - Players should know their own names client side, even though they shouldn't know their ids
  - Names should be unique
- AI Player
  - Lobby hosts, only the lobby host should be able to start the game, add AI players, etc..
  - This is to avoid race conditions
  - Lets make the first player who joined lobby host
  - Support for kicking players from the lobby
  - Support for multiple AI players
    - Make them get created with some sort of random name
- Server should sign client ids in case someone tries to modify them client side
  - If the client id is not server signed, reassign the client's clientid to a server assigned clientid
- Display vp of all players, not just yours
  - Enforce unique names in game
    - Just check name in hashmap or something and reject a connection if it has a duplicate name
- Color code end screen
  - Display vp sources separately
- Indicate empty supply piles
  - Gray them out or put an x over them
  - Just do a check on whether the count is 0 and replace the supply pile visual when it is 0
- Manual testing to ensure that all card effects work as intended
  - Unit testing here is better
    - Either use dependency injection or have a special debug method for creating testing games
- Better indication of current turn
  - Think on this
  - Highlighting of current player in player list?
  - Different border to screen???
  - Background slightly changes or flashes
  - Quick popup?
    - Easily dismissable
- Trash pile dialog pop-up button?
  - Maybe show top of trash pile
- Unit tests for cards to make sure they are working as intended
- Card Art
- Make the log better?
  - Make more recent turns at the top?
  - Organize the incoming messages by turn
  - Obscure some information about what is happening to players that are not the origin player
  - Multiple consecutive messages of the same time should be squashed together / combined into one big message
  - Color code incoming messages by what information they contain
    - Cards should be color coded by type and highlighted within the message

## Bugs

- All card effect bugs:
  - Library infinite recursion
- Game automatically switched to lobby without confirming whether you've connected to the lobby or not
