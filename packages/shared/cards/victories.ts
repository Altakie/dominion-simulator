import type { CardInfo, CardTypes } from "../cards";

export type VictoryName = "Estate" | "Duchy" | "Province"

interface Estate extends CardInfo {
  name: "Estate";
  types: [typeof CardTypes.VICTORY];
  cost: 2;
}

interface Duchy extends CardInfo {
  name: "Duchy";
  types: [typeof CardTypes.VICTORY];
  cost: 5;
}

interface Province extends CardInfo {
  name: "Province";
  types: [typeof CardTypes.VICTORY];
  cost: 8;
}