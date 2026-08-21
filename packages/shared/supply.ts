import { type Card, type CardInfo, CardTypes } from "./cards";
import {
  Bandit,
  BaseCards,
  Bureaucrat,
  Chapel,
  Harbinger,
  Market,
  Merchant,
  Militia,
  Moat,
  Sentry,
  Vassal,
  Witch,
} from "./cards/base";
import { Curse } from "./cards/curses";
import { Copper, Gold, Silver } from "./cards/treasures";
import { Duchy, Estate, Province } from "./cards/victories";
import { shuffle } from "./shuffle";

export type supplyStack = {
  card: CardInfo;
  count: number;
};

export function same_stack(a: supplyStack, b: supplyStack): boolean {
  return a.card.name === b.card.name && a.count === b.count;
}

export class Supply {
  fixed_stacks: supplyStack[];
  stacks: supplyStack[];

  constructor(playerCount: number, chosen_cards: CardInfo[]) {
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

    const kingdomCards = chosen_cards;

    const allCards: CardInfo[] = shuffle(Object.values(BaseCards));

    let i = 0;
    while (kingdomCards.length < 10) {
      const cardInfo = allCards[i]!;
      if (!kingdomCards.some((card) => card.name === cardInfo.name)) {
        kingdomCards.push(cardInfo);
      }
      i++;
    }

    kingdomCards.sort((a: CardInfo, b: CardInfo) => {
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
      { card: Chapel, count: 1 },
      { card: Moat, count: 1 },
      { card: Merchant, count: 1 },
      { card: Witch, count: 10 },
      { card: Bandit, count: 10 },
      { card: Bureaucrat, count: 10 },
      { card: Militia, count: 10 },
    ];
  }
}
