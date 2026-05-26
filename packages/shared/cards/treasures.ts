import type { CardInfo, CardTypes } from "../cards";

export type TreasureName = "Copper" | "Silver" | "Gold"

export interface Copper extends CardInfo {
  name: "Copper";
  types: [typeof CardTypes.TREASURE];
  cost: 0;
}

export interface Silver extends CardInfo {
  name: "Silver";
  types: [typeof CardTypes.TREASURE];
  cost: 3;
}

export interface Gold extends CardInfo {
  name: "Gold";
  types: [typeof CardTypes.TREASURE];
  cost: 6;
}