import type { GameState, Player } from "shared"
import type { Card, CardName } from "shared/cards"

export const effect_table: Record<CardName, (state: GameState) => void> = {
  "Copper": (state: GameState) => {
    state.money += 1
  },
  "Silver": (state: GameState) => {
    state.money += 2
  },
  "Gold": (state: GameState) => {
    state.money += 3
  },
  "Estate": (state: GameState) => {
    state.current_player.victory_points += 1
  },
  "Duchy": (state: GameState) => {
    state.current_player.victory_points += 3
  },
  "Province": (state: GameState) => {
    state.current_player.victory_points += 6
  },
  "Curse": (state: GameState) => {
    state.current_player.victory_points -= 1
  },
  "Village": (state: GameState) => {
    draw_cards(state.current_player, 1)
    state.actions += 2
  },
  "Smithy": (state: GameState) => {
    draw_cards(state.current_player, 3)
  },
  "Council Room": (state: GameState) => {
    draw_cards(state.current_player, 4)
    state.buys += 1
    // TODO: other players draw a card
  },
  "Festival": (state: GameState) => {
    state.actions += 2
    state.buys += 1
    state.money += 2
  },
  "Laboratory": (state: GameState) => {
    draw_cards(state.current_player, 2)
    state.actions += 1
  },
  "Market": (state: GameState) => {
    draw_cards(state.current_player, 1)
    state.actions += 1
    state.buys += 1
    state.money += 1
  },
  "Witch": (state: GameState) => {
    draw_cards(state.current_player, 2)
    // TODO: other players gain a Curse
  }
}

function draw_cards(player: Player, n: number) {
  for (let i = 0; i < n; i++) {
    if (player.deck.length === 0) {
      // Handle empty deck (shuffle discard pile into deck)
      player.deck = shuffle(player.discard_pile)
      player.discard_pile = []
    }
    player.hand.push(player.deck.pop()!)
  }
}

function shuffle(deck: Card[]): Card[] {
    // Fisher-Yates shuffle algorithm
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = deck[i]!;
    const b = deck[j]!;
    deck[i] = b;
    deck[j] = a;
  }
  return deck;
}