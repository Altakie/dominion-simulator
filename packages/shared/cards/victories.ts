import { type CardInfo, CardTypes } from "../cards";

export type VictoryName = "Estate" | "Duchy" | "Province"

export const Estate: CardInfo = {
  name: "Estate",
  types: [CardTypes.VICTORY],
  cost: 2
};

export const Duchy: CardInfo = {
  name: "Duchy",
  types: [CardTypes.VICTORY],
  cost: 5
};

export const Province: CardInfo = {
  name: "Province",
  types: [CardTypes.VICTORY],
  cost: 8
}