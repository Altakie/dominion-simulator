export type Card = {
  id: string,
  info: CardInfo
}

export interface CardInfo {
  name: CardName;
  types: CardType[];
  value: number;
}


export const CardTypes = Object.freeze({
  ACTION: "Action",
  REACTION: "Reaction",
  TREASURE: "Treasure",
  VICTORY: "Victory"
})

type CardType = typeof CardTypes[keyof typeof CardTypes]

export type CardName = "Copper" | "Silver" | "Gold"

interface Copper extends CardInfo {
  name: "Copper";
  types: [typeof CardTypes.TREASURE];
  value: 0;

}

interface Silver extends CardInfo {
  name: "Silver";
  types: [typeof CardTypes.TREASURE];
  value: 3;

}

interface Gold extends CardInfo {
  name: "Gold";
  types: [typeof CardTypes.TREASURE];
  value: 6;
}




