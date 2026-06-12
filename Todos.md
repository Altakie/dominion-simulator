# TODOS

## Major Features

- Gamestate rendering on client
  - Gamestate display
  - Display of server presented choices
- Client-side processing of server decision requests
- Messaging gamestate between client and server (Artem)
  - Update messages whenever the state is changed
    - For now send whole new game state
    - Could also send a log string message to each player describing what changed, like in dominion online
- Server creating a game
- Handle reactions
- Decrement action counter when action played

## Minor Features

## Bugs

- Game does not check if there's already a game in progress before starting a new game, and any player can start the game causing it to restart
