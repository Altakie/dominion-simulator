export const GamePhase = Object.freeze({
  Action: 0,
  Reaction: 1,
  Money: 2,
  Buy: 3,
  Cleanup: 4
})

export const CardType = Object.freeze({

})

export type Card = {
  id: string,
  name: string,
  type: typeof CardType
}

// export type GameState = {
//   phase: GamePhase,
// }
