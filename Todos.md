# TODOS

## Major Features

- Maybe a reorder decision type?
- Better trash pile
- Log maybe shouldn't show hand of other players
- Card reveal mechanic
- Card descriptions
- Update README
  - Include screenshot
- Redo Lobby system on frontend
  - Don't use websocket to register player names
  - Combine lobby stores and router stores
  - Make game_socket be created when the connect button is clicked
- Screen to setup game in beginning
- Actually allow player to make decisions during money phase

## Minor Features

- Show cards being drawn before dialog pops up
  - Or unblur them after dialog
- Display vp of all players, not just yours
  - Enforce unique names in game
    - Just check name in hashmap or something and reject a connection if it has a duplicate name
- Move turn information (actions, money, and buys) visually closer to where the player's eyes are spending the most time
  - Probably between the hand and the supply
- Indicate empty supply piles
  - Gray them out or put an x over them
- Show top card of discard pile and how many cards are in discard pile and deck
  - Rework the update message to not send all player information
- Show who actually wins
  - Tie breakers when vp is the same, later player should be the winner
- Manual testing to ensure that all card effects work as intended
- Better indication of current turn
  - Think on this
  - Highlighting of current player in player list?
  - Different border to screen???
  - Background slightly changes or flashes
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
