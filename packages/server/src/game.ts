import type { WSContext } from "hono/ws"
import { type Player, type GameState, GamePhases} from "shared"
import { effect_table } from "./effects";
import { Supply } from "shared/supply";
import { CardTypes, type Card, type CardInfo, type CardName } from "shared/cards"
import { MessageKinds, serializeMessage, type PickCardsRequest, type PickCardsResponse, type StartedMessage, } from "shared/messages"
import { shuffle } from "shared/shuffle"

type ServerState = Normal | WaitingForPlayer

type Normal = "Normal"

type WaitingForPlayer = {
  player: PlayerInfo,
  response_type: typeof MessageKinds.PICK_CARDS_RESPONSE | typeof MessageKinds.PICK_SUPPLY_PILE_RESPONSE | typeof MessageKinds.PICK_YES_NO_RESPONSE,
  next: (choices: Card[]) => void
}


function new_game_state(current_player_index: number, supply: Supply): GameState {
  return {
    current_player_index: current_player_index,
    phase: GamePhases.ACTION,

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
    this.game_state = new_game_state(0, new Supply(players.length))
    this.server_state = "Normal"
  }


  get_current_player(): Player {
    return this.get_player(this.game_state.current_player_index)
  }

  get_current_player_info(): PlayerInfo {
    return this.get_player_info(this.game_state.current_player_index)
  }

  get_player_info(index: number): PlayerInfo {
    return this.players[index]!
  }

  get_player(index: number): Player {
    return this.players[index]!.player
  }

  get_players(): Player[] {
    return this.players.map((player_info) => player_info.player)
  }

  get_player_names(): string[] {
    return this.players.map((player_info) => player_info.player.name)
  }

  new_turn(current_player_index: number) {
    this.game_state.phase = GamePhases.ACTION
    this.game_state.current_player_index = current_player_index

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

  action_phase() {
    if (this.game_state.actions > 0) {
      // Prompt the player to play an action card from their hand as long as they have actions
      const hand = this.get_current_player().hand
      const initial_choices = hand.filter((card) => CardTypes.ACTION in card.info.types)
      const next = (choices: Card[]) => {
        if (!isSubset(choices, hand)) {
          console.log("Error: Improper Choice")
          return
        }

        if (choices.length === 0) {
          this.game_state.phase = GamePhases.MONEY
          this.money_phase()
          return
        }

        let card_index = hand.findIndex((card) => card === choices[0]!)

        // Resolve the action effect
        this.play_card(card_index, hand)
        // Send the new gamestate to all players
        // Run the action phase again
        this.action_phase()
      }

      this.prompt_pick_card(this.get_current_player_info(), "Choose an action card to play", initial_choices, 0, 1, next)
    }

    this.game_state.phase = GamePhases.MONEY
    this.money_phase()
  }

  money_phase() {
    // play all treasure cards from hand and resolve them
    const hand = this.get_current_player().hand
    for (let [index, card] of hand.entries()) {
      if (CardTypes.TREASURE in card.info.types) {
        this.play_card(index, hand)
      }
    }
  }

  buy_phase() {
    // prompt the player to buy as many cards as they have buys from the supply
  }

  prompt_pick_card(player: PlayerInfo, description: string, choices: Card[], min: number, max: number, next: (choices: Card[]) => void) {
    const req: PickCardsRequest = {
      kind: MessageKinds.PICK_CARDS_REQUEST,

      description: description,

      choices: choices,
      min: min,
      max: max,
    }

    const req_str = serializeMessage(req)
    const waiting: WaitingForPlayer = {
      player: player,
      response_type: MessageKinds.PICK_CARDS_RESPONSE,
      next: next
    }
    this.server_state = waiting
    player.socket.send(req_str)
  }

  play_card(card_index: number, pile: Card[]) {
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

function isSubset(subset: any[], set: any[]): boolean {
  for (let member of subset) {
    if (member! in set) {
      return false
    }
  }

  return true
}
