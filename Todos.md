# TODOS

## Major Features

- Gamestate rendering on client
  - Gamestate display
    - Basic version done
  - Display of server presented choices
    - Basic version done
- Client-side processing of server decision requests
  - Missing yes no response
- Send player who is currently playing the information about their hand and discard pile
  - Server side logic to send
  - Client-side logic to display when they have the information and the server tells them they are the active player
- Messaging gamestate between client and server (Artem)
  - Update messages whenever the state is changed
    - For now send whole new game state
    - Could also send a log string message to each player describing what changed, like in dominion online
- Handle reactions
- Decrement action counter when action played

## Minor Features

## Bugs

- Game does not check if there's already a game in progress before starting a new game, and any player can start the game causing it to restart
