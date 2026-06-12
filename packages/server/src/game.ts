import type { WSContext } from "hono/ws"
import { type Player, type GameState, GamePhases } from "shared"
import { effect_table } from "./effects";
import { Supply, type supplyStack } from "shared/supply";
import { CardTypes, type Card, type CardInfo, type CardName } from "shared/cards"
import {
  MessageKinds, PickCardsDescriptions, serializeMessage, type BinaryDescription,
  type GainDescription, type PickCardsDescription, type PickCardsRequest, type PickCardsResponse,
  type PickSupplyPileRequest, type PickYesNoRequest, type StartedMessage, type Message,
  type PickSupplyPileResponse,
  type PickYesNoResponse
} from "shared/messages"
import { shuffle } from "shared/shuffle"

type WaitResponses = typeof MessageKinds.PICK_CARDS_RESPONSE | typeof MessageKinds.PICK_SUPPLY_PILE_RESPONSE | typeof MessageKinds.PICK_YES_NO_RESPONSE

type WaitInfo = {
  player_info: PlayerInfo,
  response_type: WaitResponses
  next: ((response: Message) => void)
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
  wait_info?: WaitInfo;

  constructor(players: PlayerInfo[]) {
    this.players = shuffle(players)
    this.game_state = new_game_state(0, new Supply(players.length))
    this.wait_info = undefined
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

  get_players_by_turn_order(): Player[] {
    const current_player_index = this.game_state.current_player_index
    return this.players.map((player_info) => player_info.player).slice(current_player_index)
      .concat(this.players.map((player_info) => player_info.player).slice(0, current_player_index))
  }

  get_player_names(): string[] {
    return this.players.map((player_info) => player_info.player.name)
  }

  new_turn(next_player_index: number) {
    this.game_state.phase = GamePhases.ACTION
    this.game_state.current_player_index = next_player_index

    this.game_state.played_cards = []

    this.game_state.actions = 1
    this.game_state.money = 0
    this.game_state.buys = 1
  }

  next_turn(current_player_index: number) {
    this.new_turn((current_player_index + 1) % this.players.length)
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

  next(player: PlayerInfo, response: Message) {
    if (!this.wait_info) {
      console.log("No wait info")
      return
    }
    if (player !== this.wait_info.player_info) {
      console.log("Wrong Player sent response")
      return
    }
    if (response.kind != this.wait_info.response_type) {
      console.log("Wrong response type")
      return
    }

    this.wait_info.next(response)
    // WARN: Assuming that there are no errors
    this.wait_info = undefined

  }


  action_phase() {
    if (this.game_state.actions > 0) {
      // Prompt the player to play an action card from their hand as long as they have actions
      const hand = this.get_current_player().hand
      const initial_choices = hand.filter((card) => CardTypes.ACTION in card.info.types)
      const next = (choices: Card[]) => {
        if (choices.length > 1) {
          // TODO: Maybe allow players to play multiple cards at a time if it's valid?
          console.log("Cannot play more than one card at a time")
        }
        // TODO: Reprompt if it goes wrong
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

      this.prompt_pick_card(this.get_current_player_info(), PickCardsDescriptions.PLAY, initial_choices, 0, 1, next)
      return
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

    this.game_state.phase = GamePhases.BUY
    this.buy_phase()
  }

  buy_phase() {
    // prompt the player to buy as many cards as they have buys from the supply
    //
    if (this.game_state.buys > 0) {
      // Prompt the player to pick a singular supply pile
      const supply_piles = this.game_state.supply.stacks
      const next = (choices: supplyStack[]) => {
        // TODO: Reprompt the buy if it goes wrong??
        if (choices.length > 1) {
          // TODO: Maybe allow players to buy multiple cards at a time if it's valid?
          console.log("Cannot buy more than one card at a time")
        }
        if (!isSubset(choices, supply_piles)) {
          console.log("Error: Improper Supply Pile Choice")
          return
        }

        if (choices.length === 0) {
          this.next_turn(this.game_state.current_player_index)
          return
        }
        let choice = choices[0]!

        // Gain the bought card to the discard pile
        this.gain_card(choice.card.name, this.get_current_player().discard_pile)

        // Resolve the action effect
        // Send the new gamestate to all players
        // Run the action phase again
        this.action_phase()
      }

      this.prompt_gain_card(this.get_current_player_info(), "Choose a card to gain from the supply", supply_piles, 0, 1, next)
      return
    }

    this.game_state.phase = GamePhases.MONEY
    this.money_phase()
  }


  prompt_pick_card(player: PlayerInfo, description: PickCardsDescription, choices: Card[], min: number, max: number, next: (choices: Card[]) => void) {
    const req: PickCardsRequest = {
      kind: MessageKinds.PICK_CARDS_REQUEST,

      description: description,

      choices: choices,
      min: min,
      max: max,
    }

    let wrapped_next = (response: Message): void => {
      let res = response as PickCardsResponse

      next(res.choices)
    }

    const req_str = serializeMessage(req)
    const waiting: WaitInfo = {
      player_info: player,
      response_type: MessageKinds.PICK_CARDS_RESPONSE,
      next: wrapped_next
    }
    this.wait_info = waiting
    player.socket.send(req_str)
  }

  prompt_binary_choice(player: PlayerInfo, description: BinaryDescription, card: Card, next: (choice: boolean) => void) {
    const req: PickYesNoRequest = {
      kind: MessageKinds.PICK_YES_NO_REQUEST,
      description: description,
      card: card
    }

    let wrapped_next = (response: Message): void => {
      let res = response as PickYesNoResponse

      next(res.choice)
    }

    const req_str = serializeMessage(req)
    const waiting: WaitInfo = {
      player_info: player,
      response_type: MessageKinds.PICK_YES_NO_RESPONSE,
      next: wrapped_next
    }
    this.wait_info = waiting
    player.socket.send(req_str)
  }

  prompt_gain_card(player: PlayerInfo, description: GainDescription, choices: supplyStack[], min: number, max: number, next: (choices: supplyStack[]) => void) {
    const req: PickSupplyPileRequest = {
      kind: MessageKinds.PICK_SUPPLY_PILE_REQUEST,
      description: description,
      choices: choices,
      min: min,
      max: max
    }

    let wrapped_next = (response: Message): void => {
      let res = response as PickSupplyPileResponse

      next(res.choices)
    }


    const req_str = serializeMessage(req)
    const waiting: WaitInfo = {
      player_info: player,
      response_type: MessageKinds.PICK_SUPPLY_PILE_RESPONSE,
      next: wrapped_next
    }
    this.wait_info = waiting
    player.socket.send(req_str)
  }

  draw_cards(player: Player, num_cards: number) {
    for (let i = 0; i < num_cards; i++) {
      if (player.deck.length === 0) {
        player.deck = shuffle(player.discard_pile)
        player.discard_pile = []
      }
      player.hand.push(player.deck.pop()!)
    }
  }

  play_card(card_index: number, pile: Card[]) {
    const card = this.remove_card(card_index, pile)
    effect_table[card.info.name](this)
    this.game_state.played_cards.push(card)
  }

  discard_card(player: Player, card_index: number, pile: Card[]) {
    if (pile === player.deck && player.deck.length === 0) {
      player.deck = shuffle(player.discard_pile)
      player.discard_pile = []
    }
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
