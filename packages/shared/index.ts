import { type Card } from "./cards"
import { Supply } from "./supply"

// export const GamePhase = Object.freeze({
//   Action: 0,
//   Reaction: 1,
//   Money: 2,
//   Buy: 3,
//   Cleanup: 4
// })



export const GamePhase = Object.freeze({
  ACTION: "Action",
  MONEY: "Money",
  BUY: "Buy",
  REACTION: "Reaction",
  // CLEANUP: "Cleanup"
})

export type GamePhases = typeof GamePhase[keyof typeof GamePhase]

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
  phase: GamePhases;
  current_player: Player;
  turn_number: number;

  active_card?: Card;

  supply: Supply;

  actions: number;
  money: number;
  buys: number;
}

