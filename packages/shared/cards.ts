import type { GameState } from ".";

export type Card = {
  id: string,
  info: CardInfo
}

export interface CardInfo {
  name: string;
  types: CardType[];
  value: number;
}


const CardTypes = Object.freeze({
  ACTION: "Action",
  REACTION: "Reaction",
  TREASURE: "Treasure",
  VICTORY: "Victory"
})

type CardType = typeof CardTypes[keyof typeof CardTypes]

type CardName = "Copper" | "Silver" | "Gold"

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


const effect_table: Record<CardName, (state: GameState) => void> = {
  "Copper": (state: GameState) => {
    state.money += 1
  },
  "Silver": (state: GameState) => {
    state.money += 2
  },
  "Gold": (state: GameState) => {
    state.money += 3
  }
}





