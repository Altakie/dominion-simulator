# TODOS

## Major Features

- Gamestate rendering on client
  - Gamestate display
    - Basic version done
  - Display of server presented choices
    - Basic version done
- Handle reactions
- Game end
  - Need to have check for game end after each players turn and send a special message when the game is over
  - Then need to return all players to lobby and terminate the current game object
  - Probably want a lobby on the server side as well, instead of doing everything in index.ts
- Victory Points
  - Need to add victory points when cards are added to the deck/discard pile
  - Need to remove victory points when cards are trashed
- Better visuals
- Maybe a reorder decision type?

## Minor Features

- Maybe use zustand for better state management

## Bugs

- Game does not check if there's already a game in progress before starting a new game, and any player can start the game causing it to restart
- cards
  - Library sends messages for all card decisions, but only prompts for the first one on the client
  - Sentry does not keep track of what cards have been trashed properly
