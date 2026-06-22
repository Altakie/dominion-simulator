import { type CardInfo, CardTypes } from "../cards";

export type TreasureName = "Copper" | "Silver" | "Gold";

export const Copper: CardInfo = {
  name: "Copper",
  types: [CardTypes.TREASURE],
  cost: 0,
};

export const Silver: CardInfo = {
  name: "Silver",
  types: [CardTypes.TREASURE],
  cost: 3,
};

export const Gold: CardInfo = {
  name: "Gold",
  types: [CardTypes.TREASURE],
  cost: 6,
};
