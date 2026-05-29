import { type Card } from "./cards"
import { Supply } from "./supply"

// export const GamePhase = Object.freeze({
//   Action: 0,
//   Reaction: 1,
//   Money: 2,
//   Buy: 3,
//   Cleanup: 4
// })



export const GamePhases = Object.freeze({
  ACTION: "Action",
  MONEY: "Money",
  BUY: "Buy",
  REACTION: "Reaction",
  // CLEANUP: "Cleanup"
})

export type GamePhase = typeof GamePhases[keyof typeof GamePhases]

export type Player = {
  name: string,
  hand: Card[],
  deck: Card[],
  discard_pile: Card[],


  victory_points: number
}

export function new_player(name: string): Player {
  return {
    name: name,
    hand: [],
    deck: [],
    discard_pile: [],
    victory_points: 0
  }
}

export type GameState = {
  phase: GamePhase;
  current_player_index: number;
  turn_number: number;

  played_cards: Card[];

  supply: Supply;
  trash_pile: Card[]

  actions: number;
  money: number;
  buys: number;
}

