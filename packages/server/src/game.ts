import type { WSContext } from "hono/ws"
import { type Player, type GameState, GamePhase } from "shared"
import { effect_table } from "./effects";
import { Supply } from "shared/supply";
import { CardTypes, type CardInfo, type CardName } from "shared/cards"
import { MessageKind, serializeMessage } from "shared/messages"
import { shuffle } from "shared/shuffle"

function new_game_state(current_player: Player, supply: Supply): GameState {
  return {
    current_player: current_player,
    phase: GamePhase.ACTION,

    turn_number: 1,

    supply: supply,

    actions: 1,
    money: 0,
    buys: 1,
  }
}

export type PlayerInfo = {
  player: Player,
  clientid: string,
  socket: WSContext
}

export class Game {
  players: PlayerInfo[];
  state: GameState;

  constructor(players: PlayerInfo[]) {
    this.players = shuffle(players)
    this.state = new_game_state(this.players[0]!.player, new Supply(players.length))
  }

  get_players(): Player[] {
    return this.players.map((player_info) => player_info.player)
  }

  get_player_names(): string[] {
    return this.players.map((player_info) => player_info.player.name)
  }

  new_turn(current_player: Player) {
    this.state.phase = GamePhase.ACTION
    this.state.current_player = current_player

    this.state.active_card = undefined

    this.state.actions = 1
    this.state.money = 0
    this.state.buys = 1
  }

  start_game() {
    for (let player of this.players) {
      player.socket.send(serializeMessage({ kind: MessageKind.START }))
    }
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

