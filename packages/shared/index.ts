import { type Card } from "./cards"

// export const GamePhase = Object.freeze({
//   Action: 0,
//   Reaction: 1,
//   Money: 2,
//   Buy: 3,
//   Cleanup: 4
// })


type GamePhase = "Action" | "Money" | "Buy" | "Reaction" | "Cleanup"

type Player = {
  name: string,
  hand: Card[],
  deck: Card[],
  discard_pile: Card[]
}

export type GameState = {
  phase: GamePhase,
  currentPlayer: Player,
  turn_number: number,

  active_card?: Card,

  actions: number,
  money: number,
  buys: number,
}
