# TODOS

## Major Features

- Handle reactions
- Game end
  - Need to have check for game end after each players turn and send a special message when the game is over
  - Then need to return all players to lobby and terminate the current game object
  - Probably want a lobby on the server side as well, instead of doing everything in index.ts
- Maybe a reorder decision type?
- Log on client
- Better visuals
  - Coloring and stuff
  - Better positioning of elements
  - Choices overlaid on hand and supply piles
- Better trash pile
- Choose card decision should also allow you to choose cards not in your hand
- Make borders for selected cards more clear

## Minor Features

- Maybe use zustand for better state management

## Bugs

- Game does not check if there's already a game in progress before starting a new game, and any player can start the game causing it to restart
- cards
  - Library sends messages for all card decisions, but only prompts for the first one on the client
  - Sentry does not keep track of what cards have been trashed properly
