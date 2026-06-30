import { type Card, type CardInfo, CardTypes } from "./cards";
import { BaseCards, Chapel, Market, Sentry, Vassal } from "./cards/base";
import { Curse } from "./cards/curses";
import { Copper, Gold, Silver } from "./cards/treasures";
import { Duchy, Estate, Province } from "./cards/victories";
import { shuffle } from "./shuffle";

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

    this.stacks = [];

    const kingdomCards: CardInfo[] = shuffle(Object.values(BaseCards))
      .slice(0, 10)
      .sort((a: CardInfo, b: CardInfo) => {
        if (a.cost === b.cost) {
          return a.name.localeCompare(b.name);
        }
        return a.cost - b.cost;
      });

    for (const card of kingdomCards) {
      if (card.types.includes(CardTypes.VICTORY)) {
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
    const stack = this.getStacks().find((s) => s.card.name === cardName);
    if (stack && stack.count > 0) {
      stack.count--;
      return { id: `${cardName}-${Date.now()}`, info: stack.card };
    }
    return null;
  }

  toggleDebugMode() {
    this.stacks = [
      { card: Chapel, count: 10 },
      { card: Sentry, count: 10 },
      { card: Vassal, count: 10 },
      { card: Market, count: 10 },
    ];
  }
}
