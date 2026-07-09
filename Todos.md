# TODOS

## Major Features

- Attack cards don't work with more than two players
  - Bureacrat
- Maybe a reorder decision type?
- Better trash pile
- Card reveal mechanic
- Redo Lobby system on frontend
  - Don't use websocket to register player names
    - Server Side
      - Can just use a put request
        - Update a player's name on put request
        - Return whether it was successful or not
          - Should fail if the name is not unique in the lobby the player is trying to join``
    - Client Side
      - Send out request and wait for server response before trying to load into lobby
        - Suspend while waiting for server response
        - Only switch to lobby view and try to connect to game socket on successful server response
    - Then can have lobby's with ids
      - Can share lobby code with other players to allow joining
      - Password locked lobbies
  - Combine lobby stores and router stores
  - Make game_socket be created when the connect button is clicked
- Screen to setup game in beginning
- Actually allow player to make decisions during money phase

## Minor Features

- AI Player
- Server should sign client ids in case someone tries to modify them client side
- Show cards being drawn before dialog pops up
  - Or unblur them after dialog
- Display vp of all players, not just yours
  - Enforce unique names in game
    - Just check name in hashmap or something and reject a connection if it has a duplicate name
- Move turn information (actions, money, and buys) visually closer to where the player's eyes are spending the most time
  - Probably between the hand and the supply
- Indicate empty supply piles
  - Gray them out or put an x over them
  - Just do a check on whether the count is 0 and replace the supply pile visual when it is 0
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
- Manual testing to ensure that all card effects work as intended
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
