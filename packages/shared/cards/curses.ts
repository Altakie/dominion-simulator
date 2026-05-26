import type { CardInfo, CardTypes } from "../cards";

export type CurseName = "Curse"

interface Curse extends CardInfo {
  name: "Curse";
  types: [typeof CardTypes.CURSE];
  cost: 0;
}