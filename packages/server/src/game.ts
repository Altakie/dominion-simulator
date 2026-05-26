import { type Player, type GameState, GamePhase } from "shared"
import { CardTypes, type CardInfo } from "shared/cards"
import { effect_table } from "./effects";

function new_game_state(current_player: Player): GameState {
  return {
    current_player: current_player,
    phase: GamePhase.ACTION,

    turn_number: 1,

    actions: 1,
    money: 0,
    buys: 1,
  }
}

export class Game {
  players: Player[];
  state: GameState;
  supply: CardInfo[];

  constructor(players: Player[]) {
    this.players = players
    this.state = new_game_state(this.players[0]!)
    this.supply = []
  }

  get_players(): Player[] {
    return this.players
  }

  new_turn(current_player: Player) {
    this.state.phase = GamePhase.ACTION
    this.state.current_player = current_player

    this.state.active_card = undefined

    this.state.actions = 1
    this.state.money = 0
    this.state.buys = 1
  }

  action_phase() {
    // Prompt the player to play an action card from their hand
  }

  money_phase() {
    // play all treasure cards from hand and resolve them
    for (let card of this.state.current_player.hand) {
      if (CardTypes.TREASURE in card.info.types) {
        effect_table[card.info.name](this.state)
      }
    }
  }

  buy_phase() {
    // prompt the player to buy as many cards as they have buys from the supply
  }
}

