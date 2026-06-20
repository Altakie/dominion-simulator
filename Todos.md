# TODOS

## Major Features

- Maybe a reorder decision type?
- Log on client
- Better visuals
  - Coloring and stuff
  - Better positioning of elements
  - Choices overlaid on hand and supply piles
- Better trash pile
- Better handling of choose card decisions
  - Choose card decision should also allow you to choose cards not in your hand but in a clean way
- Make borders for selected cards more clear

## Minor Features

- Maybe use zustand for better state management

## Bugs

- Game does not check if there's already a game in progress before starting a new game, and any player can start the game causing it to restart
- cards
  - Library sends messages for all card decisions, but only prompts for the first one on the client
  - Sentry does not keep track of what cards have been trashed properly
