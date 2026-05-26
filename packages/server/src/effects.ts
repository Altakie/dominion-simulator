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
  },
  "Gold": (game: Game) => {
    game.game_state.money += 3
  },
  "Estate": (game: Game) => {
    game.game_state.current_player.victory_points += 1
  },
  "Duchy": (game: Game) => {
    game.game_state.current_player.victory_points += 3
  },
  "Province": (game: Game) => {
    game.game_state.current_player.victory_points += 6
  },
  "Gardens": (game: Game) => {
    game.game_state.current_player.victory_points += 
    Math.floor(game.game_state.current_player.deck.length / 10 + 
      game.game_state.current_player.discard_pile.length / 10 + 
      game.game_state.current_player.hand.length / 10)
  },
  "Curse": (game: Game) => {
    game.game_state.current_player.victory_points -= 1
  },
  "Cellar": (game: Game) => {
    // TODO: Implement Cellar effect
  },
  "Chapel": (game: Game) => {
    // TODO: Implement Chapel effect
  },
  "Moat": (game: Game) => {
    draw_cards(game.game_state.current_player, 2)
  },
  "Harbinger": (game: Game) => {
    draw_cards(game.game_state.current_player, 1)
    game.game_state.actions += 1
    // TODO: Implement Harbinger's ability to put a card from discard pile on top of deck
  },
  "Merchant": (game: Game) => {
    draw_cards(game.game_state.current_player, 1)
    game.game_state.actions += 1
    // TODO: Implement Merchant's ability to give +1 money for first Silver played
  },
  "Vassal": (game: Game) => {
    game.game_state.money += 2
    // TODO: Implement Vassal's ability to play an Action card from deck
  },
  "Village": (game: Game) => {
    draw_cards(game.game_state.current_player, 1)
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
    draw_cards(game.game_state.current_player, 1)
    game.game_state.money += 1
    game.game_state.actions += 1
  },
  "Remodel": (game: Game) => {
    // TODO: Implement Remodel effect
  },
  "Smithy": (game: Game) => {
    draw_cards(game.game_state.current_player, 3)
  },
  "Throne Room": (game: Game) => {
    // TODO: Implement Throne Room effect
  },
  "Bandit": (game: Game) => {
    // TODO: Implement Bandit effect
  },
  "Council Room": (game: Game) => {
    draw_cards(game.game_state.current_player, 4)
    game.game_state.buys += 1
    for (let player_info of game.players) {
      if (player_info.player !== game.game_state.current_player) {
        draw_cards(player_info.player, 1)
      }
    }
  },
  "Festival": (game: Game) => {
    game.game_state.actions += 2
    game.game_state.buys += 1
    game.game_state.money += 2
  },
  "Laboratory": (game: Game) => {
    draw_cards(game.game_state.current_player, 2)
    game.game_state.actions += 1
  },
  "Library": (game: Game) => {
    // TODO: Implement Library effect
  },
  "Market": (game: Game) => {
    draw_cards(game.game_state.current_player, 1)
    game.game_state.actions += 1
    game.game_state.buys += 1
    game.game_state.money += 1
  },
  "Mine": (game: Game) => {
    // TODO: Implement Mine effect
  },
  "Sentry": (game: Game) => {
    draw_cards(game.game_state.current_player, 1)
    game.game_state.actions += 1
    // TODO: Implement Sentry's ability
  },
  "Witch": (game: Game) => {
    draw_cards(game.game_state.current_player, 2)
    let index = game.players.findIndex(p => p.player === game.game_state.current_player)
    let ordered_players = [...game.players.slice(index + 1), ...game.players.slice(0, index)]
    for (let player_info of ordered_players) {
      if (player_info.player !== game.game_state.current_player) {
        player_info.player.discard_pile.push(game.game_state.supply.gainCard(Curse.name)!)
      }
    }
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

