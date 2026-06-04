import type { Card, CardInfo } from "./cards"
import { Copper, Silver, Gold } from "./cards/treasures"
import { Estate, Duchy, Province } from "./cards/victories"
import { Curse } from "./cards/curses"
import { shuffle } from "./shuffle"
import { BaseCards } from "./cards/base"

export type supplyStack = {
  card: CardInfo,
  count: number
}

export class Supply {
  stacks: supplyStack[]

  constructor(playerCount: number) {
    let victoryCount: number = playerCount === 2 ? 8 : 12
    this.stacks = [
      { card: Copper, count: 60 - (7 * playerCount) },
      { card: Silver, count: 40 },
      { card: Gold, count: 30 },
      { card: Estate, count: victoryCount },
      { card: Duchy, count: victoryCount },
      { card: Province, count: victoryCount },
      { card: Curse, count: 10 * playerCount }
    ]

    let kingdomCards = shuffle(Object.values(BaseCards)).slice(0, 10)
    for (let card of kingdomCards) {
      if (card.name === "Gardens") {
        this.stacks.push({ card: card, count: victoryCount })
      } else {
        this.stacks.push({ card: card, count: 10 })
      }
    }
  }

  getStacks(): supplyStack[] {
    return this.stacks
  }

  gainCard(cardName: string): Card | null {
    const stack = this.stacks.find(s => s.card.name === cardName)
    if (stack && stack.count > 0) {
      stack.count--
      return { id: `${cardName}-${Date.now()}`, info: stack.card }
    }
    return null
  }
}
