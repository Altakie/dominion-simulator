# TODOS

## Major Features

- Maybe a reorder decision type?
- Better trash pile
- Log maybe shouldn't show hand of other players
- Card reveal mechanic
- Card descriptions

## Minor Features

- Show message description within dialog
- Sort supply piles first by cost then alphabetically
- Send game-state updates at different times
  - After draw cards
  - After a gain event
  - After a trash event
  - Maybe every time a log message is sent?
- Maybe have played cards in a straight line but allow them to overflow?
  - Should always scroll to end
- Display vp of all players, not just yours
- Move turn information (actions, money, and buys) visually closer to where the player's eyes are spending the most time
  - Probably between the hand and the supply
- Indicate empty supply piles
  - Gray them out or put an x over them
- Show top card of discard pile and how many cards are in discard pile and deck
  - Rework the update message to not send all player information
- Manual testing to ensure that all card effects work as intended
- Unit tests for cards to make sure they are working as intended
- Trash pile dialog pop-up button?
- Card visuals and descriptions
  - Can download official card art from dominion wiki?
  - Or can write descriptions for each card that can show up as a tooltip when you hover over a card
- Make the log better?
  - Make more recent turns at the top?
  - Organize the incoming messages by turn
  - Obscure some information about what is happening to players that are not the origin player
  - Multiple consecutive messages of the same time should be squashed together / combined into one big message
  - Color code incoming messages by what information they contain
    - Cards should be color coded by type and highlighted within the message
- Better indication of current turn

## Bugs

- All card effect bugs:
  - Library infinite recursion
