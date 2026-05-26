import type { GameState, Player } from "shared"
import type { CardName } from "shared/cards"

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
  "Gardens": (state: GameState) => {
    state.current_player.victory_points += 
    Math.floor(state.current_player.deck.length / 10 + 
      state.current_player.discard_pile.length / 10 + 
      state.current_player.hand.length / 10)
  },
  "Curse": (state: GameState) => {
    state.current_player.victory_points -= 1
  },
  "Cellar": (state: GameState) => {
    // TODO: Implement Cellar effect
  },
  "Chapel": (state: GameState) => {
    // TODO: Implement Chapel effect
  },
  "Moat": (state: GameState) => {
    draw_cards(state.current_player, 2)
    // TODO: Implement Moat's reaction effect
  },
  "Harbinger": (state: GameState) => {
    draw_cards(state.current_player, 1)
    state.actions += 1
    // TODO: Implement Harbinger's ability to put a card from discard pile on top of deck
  },
  "Merchant": (state: GameState) => {
    draw_cards(state.current_player, 1)
    state.actions += 1
    // TODO: Implement Merchant's ability to give +1 money for first Silver played
  },
  "Vassal": (state: GameState) => {
    state.money += 2
    // TODO: Implement Vassal's ability to play an Action card from deck
  },
  "Village": (state: GameState) => {
    draw_cards(state.current_player, 1)
    state.actions += 2
  },
  "Workshop": (state: GameState) => {
    // TODO: Implement Workshop effect
  },
  "Bureaucrat": (state: GameState) => {
    // TODO: Implement Bureaucrat effect
  },
  "Militia": (state: GameState) => {
    state.money += 2
    // TODO: Implement Militia effect
  },
  "Moneylender": (state: GameState) => {
    // TODO: Implement Moneylender effect
  },
  "Poacher": (state: GameState) => {
    draw_cards(state.current_player, 1)
    state.money += 1
    state.actions += 1
  },
  "Remodel": (state: GameState) => {
    // TODO: Implement Remodel effect
  },
  "Smithy": (state: GameState) => {
    draw_cards(state.current_player, 3)
  },
  "Throne Room": (state: GameState) => {
    // TODO: Implement Throne Room effect
  },
  "Bandit": (state: GameState) => {
    // TODO: Implement Bandit effect
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
  "Library": (state: GameState) => {
    // TODO: Implement Library effect
  },
  "Market": (state: GameState) => {
    draw_cards(state.current_player, 1)
    state.actions += 1
    state.buys += 1
    state.money += 1
  },
  "Mine": (state: GameState) => {
    // TODO: Implement Mine effect
  },
  "Sentry": (state: GameState) => {
    draw_cards(state.current_player, 1)
    state.actions += 1
    // TODO: Implement Sentry's ability
  },
  "Witch": (state: GameState) => {
    draw_cards(state.current_player, 2)
    // TODO: other players gain a Curse
  },
  "Artisan": (state: GameState) => {
    // TODO: Implement Artisan effect
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

