import type { BaseName } from "./cards/base";
import type { CurseName } from "./cards/curses";
import type { TreasureName } from "./cards/treasures";
import type { VictoryName } from "./cards/victories";

export type Card = {
  id: string,
  info: CardInfo
}

export type CardInfo = {
  name: CardName;
  types: CardType[];
  cost: number;
}

export const CardTypes = Object.freeze({
  ACTION: "Action",
  REACTION: "Reaction",
  TREASURE: "Treasure",
  VICTORY: "Victory",
  CURSE: "Curse",
})

type CardType = typeof CardTypes[keyof typeof CardTypes]

export type CardName = BaseName | TreasureName | VictoryName | CurseName

