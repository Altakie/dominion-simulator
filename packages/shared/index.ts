import type { Card } from "./cards";
import type { Supply } from "./supply";

// export const GamePhase = Object.freeze({
//   Action: 0,
//   Reaction: 1,
//   Money: 2,
//   Buy: 3,
//   Cleanup: 4
// })

export const GamePhases = Object.freeze({
  ACTION: "Action",
  MONEY: "Money",
  BUY: "Buy",
  REACTION: "Reaction",
  // CLEANUP: "Cleanup"
});

export type GamePhase = (typeof GamePhases)[keyof typeof GamePhases];

export type Player = {
  name: string;
  hand: Card[];
  deck: Card[];
  discard_pile: Card[];

  victory_points: number;
};

export type SharablePlayer = {
  name: string;
  hand: Card[];
  deck_size: number;
  top_of_discard_pile?: Card;
  discard_pile_size: number;
  victory_points: number;
};

export type PlayerDisplayInfo = {
  name: string;
  total_cards: number;
  victory_points: number;
};

export type PlayerEndInfo = {
  name: string;
  victory_points: number;
  final_deck: Card[];
};

export type GameState = {
  phase: GamePhase;
  current_player_index: number;
  turn_number: number;

  attack_index: number | null;

  played_cards: Card[];
  set_aside_cards: Card[];

  supply: Supply;
  trash_pile: Card[];

  actions: number;
  money: number;
  buys: number;
};
