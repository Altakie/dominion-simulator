import type { Card, CardInfo } from "./cards"
import { Copper, Silver, Gold } from "./cards/treasures"
import { Estate, Duchy, Province } from "./cards/victories"
import { Curse } from "./cards/curses"
import { shuffle } from "./shuffle"
import { Artisan, BaseCards, Cellar, Chapel, Gardens, Harbinger, Library, Merchant, Mine, Moat, Moneylender, Poacher, Remodel, Sentry, ThroneRoom, Vassal, Village, Witch, Workshop } from "./cards/base"

export type supplyStack = {
  card: CardInfo;
  count: number;
};

export class Supply {
  fixed_stacks: supplyStack[];
  stacks: supplyStack[];

  constructor(playerCount: number) {
    const victoryCount: number = playerCount === 2 ? 8 : 12;
    this.fixed_stacks = [
      { card: Copper, count: 60 - 7 * playerCount },
      { card: Silver, count: 40 },
      { card: Gold, count: 30 },
      { card: Estate, count: victoryCount },
      { card: Duchy, count: victoryCount },
      { card: Province, count: victoryCount },
      { card: Curse, count: 10 * playerCount },
    ];

    this.stacks = []

    const kingdomCards = shuffle(Object.values(BaseCards)).slice(0, 10);
    for (const card of kingdomCards) {
      if (card.name === "Gardens") {
        this.stacks.push({ card: card, count: victoryCount });
      } else {
        this.stacks.push({ card: card, count: 10 });
      }
    }
  }

  getStacks(): supplyStack[] {
    return this.fixed_stacks.concat(this.stacks);
  }

  gainCard(cardName: string): Card | null {
    const stack = this.stacks.find((s) => s.card.name === cardName);
    if (stack && stack.count > 0) {
      stack.count--;
      return { id: `${cardName}-${Date.now()}`, info: stack.card };
    }
    return null;
  }

  toggleDebugMode() {
    this.stacks = [
      { card: Copper, count: 46 },
      { card: Silver, count: 40 },
      { card: Gold, count: 30 },
      { card: Estate, count: 8 },
      { card: Duchy, count: 8 },
      { card: Province, count: 1 },
      { card: Curse, count: 20 },
      { card: Harbinger, count: 10 },
    ]
  }
}
