import type { Card, CardInfo } from "./cards";
import { BaseCards, Chapel, Gardens, Moat, Witch } from "./cards/base";
import { Curse } from "./cards/curses";
import { Copper, Gold, Silver } from "./cards/treasures";
import { Duchy, Estate, Province } from "./cards/victories";
import { shuffle } from "./shuffle";

export type supplyStack = {
  card: CardInfo;
  count: number;
};

export class Supply {
  stacks: supplyStack[];

  constructor(playerCount: number) {
    const victoryCount: number = playerCount === 2 ? 8 : 12;
    this.stacks = [
      { card: Copper, count: 60 - 7 * playerCount },
      { card: Silver, count: 40 },
      { card: Gold, count: 30 },
      { card: Estate, count: victoryCount },
      { card: Duchy, count: victoryCount },
      { card: Province, count: victoryCount },
      { card: Curse, count: 10 * playerCount },
    ];

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
    return this.stacks;
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
      { card: Moat, count: 10 },
      { card: Witch, count: 10 },
      { card: Chapel, count: 10 },
    ];
  }
}
