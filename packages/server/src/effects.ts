import type { Player } from "shared"
import type { CardName } from "shared/cards"
import { shuffle } from "shared/shuffle"
import type { Game } from "./game"
import { Curse } from "shared/cards/curses"

export const effect_table: Record<CardName, (game: Game) => void> = {
  "Copper": (game: Game) => {
    game.game_state.money += 1
  },
  "Silver": (game: Game) => {
    game.game_state.money += 2
    // Handle Silver's interaction with Merchant card
    if (!game.game_state.played_cards.some(card => card.info.name === "Silver")) {
      let played = game.game_state.played_cards
      let num_merchants = played.filter(card => card.info.name === "Merchant").length
      game.game_state.money += num_merchants
    }
  },
  "Gold": (game: Game) => {
    game.game_state.money += 3
  },
  "Estate": (game: Game) => {
    game.get_current_player().victory_points += 1
  },
  "Duchy": (game: Game) => {
    game.get_current_player().victory_points += 3
  },
  "Province": (game: Game) => {
    game.get_current_player().victory_points += 6
  },
  "Gardens": (game: Game) => {
    let player = game.get_current_player()
    player.victory_points +=
      Math.floor(player.deck.length / 10 +
        player.discard_pile.length / 10 +
        player.hand.length / 10)
  },
  "Curse": (game: Game) => {
    game.get_current_player().victory_points -= 1
  },
  "Cellar": (game: Game) => {
    game.game_state.actions += 1
    // TODO: Implement Cellar effect
  },
  "Chapel": (game: Game) => {
    // TODO: Implement Chapel effect
  },
  "Moat": (game: Game) => {
    draw_cards(game.get_current_player(), 2)
    // TODO: Implement Moat's reaction effect
  },
  "Harbinger": (game: Game) => {
    draw_cards(game.get_current_player(), 1)
    game.game_state.actions += 1
    // TODO: Implement Harbinger's ability to put a card from discard pile on top of deck
  },
  "Merchant": (game: Game) => {
    draw_cards(game.get_current_player(), 1)
    game.game_state.actions += 1
    // Merchant effect is handled in the Silver case of the effect table
  },
  "Vassal": (game: Game) => {
    game.game_state.money += 2
    // TODO: Implement Vassal's ability to play an Action card from deck
  },
  "Village": (game: Game) => {
    draw_cards(game.get_current_player(), 1)
    game.game_state.actions += 2
  },
  "Workshop": (game: Game) => {
    // TODO: Implement Workshop effect
  },
  "Bureaucrat": (game: Game) => {
    // TODO: Implement Bureaucrat effect
  },
  "Militia": (game: Game) => {
    game.game_state.money += 2
    // TODO: Implement Militia effect
  },
  "Moneylender": (game: Game) => {
    // TODO: Implement Moneylender effect
  },
  "Poacher": (game: Game) => {
    draw_cards(game.get_current_player(), 1)
    game.game_state.money += 1
    game.game_state.actions += 1
  },
  "Remodel": (game: Game) => {
    // TODO: Implement Remodel effect
  },
  "Smithy": (game: Game) => {
    draw_cards(game.get_current_player(), 3)
  },
  "Throne Room": (game: Game) => {
    // TODO: Implement Throne Room effect
  },
  "Bandit": (game: Game) => {
    // TODO: Implement Bandit effect
  },
  "Council Room": (game: Game) => {
    draw_cards(game.get_current_player(), 4)
    game.game_state.buys += 1
    // TODO: other players draw a card
  },
  "Festival": (game: Game) => {
    game.game_state.actions += 2
    game.game_state.buys += 1
    game.game_state.money += 2
  },
  "Laboratory": (game: Game) => {
    draw_cards(game.get_current_player(), 2)
    game.game_state.actions += 1
  },
  "Library": (game: Game) => {
    // TODO: Implement Library effect
  },
  "Market": (game: Game) => {
    draw_cards(game.get_current_player(), 1)
    game.game_state.actions += 1
    game.game_state.buys += 1
    game.game_state.money += 1
  },
  "Mine": (game: Game) => {
    // TODO: Implement Mine effect
  },
  "Sentry": (game: Game) => {
    draw_cards(game.get_current_player(), 1)
    game.game_state.actions += 1
    // TODO: Implement Sentry's ability
  },
  "Witch": (game: Game) => {
    draw_cards(game.get_current_player(), 2)
    // TODO: other players gain a Curse
  },
  "Artisan": (game: Game) => {
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

