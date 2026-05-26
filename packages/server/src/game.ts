import type { WSContext } from "hono/ws"
import { type Player, type GameState, type GamePhases, GamePhase } from "shared"
import { effect_table } from "./effects";
import { Supply } from "shared/supply";
import { CardTypes, type Card, type CardInfo, type CardName } from "shared/cards"
import { MessageKinds, serializeMessage, type PickCardsRequest, type StartedMessage, } from "shared/messages"
import { shuffle } from "shared/shuffle"

type ServerState = GamePhases | WaitingForPlayer

type WaitingForPlayer = {
  player: Player,
  response_type: Response,
  continuation: (game: Game) => void
}


function new_game_state(current_player: Player, supply: Supply): GameState {
  return {
    current_player: current_player,
    phase: GamePhase.ACTION,

    turn_number: 1,

    supply: supply,
    played_cards: [],

    trash_pile: [],

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
  game_state: GameState;
  server_state: ServerState;

  constructor(players: PlayerInfo[]) {
    this.players = shuffle(players)
    this.game_state = new_game_state(this.players[0]!.player, new Supply(players.length))
    this.server_state = GamePhase.ACTION
  }

  get_players(): Player[] {
    return this.players.map((player_info) => player_info.player)
  }

  get_player_names(): string[] {
    return this.players.map((player_info) => player_info.player.name)
  }

  new_turn(current_player: Player) {
    this.game_state.phase = GamePhase.ACTION
    this.game_state.current_player = current_player

    this.game_state.played_cards = []

    this.game_state.actions = 1
    this.game_state.money = 0
    this.game_state.buys = 1
  }

  start_game() {
    const started_msg: StartedMessage = {
      kind: MessageKinds.STARTED,
      player_name_order: this.get_player_names(),
      state: this.game_state
    }

    const started_msg_str = serializeMessage(started_msg)

    for (let player of this.players.values()) {
      player.socket.send(started_msg_str)
    }
  }

  async action_phase() {
    while (this.game_state.actions > 0) {
      // Prompt the player to play an action card from their hand as long as they have actions
      // Resolve the action effect
      // Send the new gamestate to all players
    }
  }

  money_phase() {
    // play all treasure cards from hand and resolve them
    const hand = this.game_state.current_player.hand
    for (let [index, card] of hand.entries()) {
      if (CardTypes.TREASURE in card.info.types) {
        this.play_card(index, hand)
      }
    }
  }

  async buy_phase() {
    // prompt the player to buy as many cards as they have buys from the supply
  }

  // async prompt_pick_card(player: Player, description: string, choices: Card[], min: number, max: number,): Promise<Card[]> {
  //   const req: PickCardsRequest = {
  //     kind: MessageKinds.PICK_CARDS_REQUEST,
  //
  //     description: description,
  //
  //     choices: choices,
  //     min: min,
  //     max: max,
  //   }
  //
  //   const req_str = serializeMessage(req)
  //
  // }

  async play_card(card_index: number, pile: Card[]) {
    const card = this.remove_card(card_index, pile)
    effect_table[card.info.name](this)
    this.game_state.played_cards.push(card)
  }

  discard_card(player: Player, card_index: number, pile: Card[]) {
    const card = this.remove_card(card_index, pile)
    player.discard_pile.push(card)
  }

  gain_card(card_name: CardName, pile: Card[]) {
    const card = this.game_state.supply.gainCard(card_name)
    if (card) {
      pile.push(card)
    }
  }

  trash_card(card_index: number, pile: Card[]) {
    const card = this.remove_card(card_index, pile)
    this.game_state.trash_pile.push(card)
  }

  remove_card(card_index: number, pile: Card[]): Card {
    return pile.splice(card_index, 1)[0]!
  }
}

