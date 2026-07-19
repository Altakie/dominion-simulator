import type { Player } from "./index.ts";

export const PickCardsDescriptions = Object.freeze({
  DISCARD_ANY: "Choose card(s) to discard",
  TRASH_ANY: "Choose card(s) to trash",

  PLAY: "Choose a card to play",
  PUT_ON_DECK: "Choose a card to put on top of your deck",
  REACT: "You may choose a reaction",
});

export const BinaryDescriptions = Object.freeze({
  BINARY_PLAY: "Play this card?",
  BINARY_PUT_IN_HAND: "Put this card in your hand?",
  BINARY_REACT: "Reveal this card to block attack?",
});

export const GainDescriptions = Object.freeze({
  GAIN: "Choose a card to gain from the supply",
});

export type PickCardsDescription =
  (typeof PickCardsDescriptions)[keyof typeof PickCardsDescriptions];
export type BinaryDescription =
  (typeof BinaryDescriptions)[keyof typeof BinaryDescriptions];
export type GainDescription =
  (typeof GainDescriptions)[keyof typeof GainDescriptions];

export function top_deck_message(player: Player, num_cards: number) {
  if (num_cards === 1) {
    return `${player.name} put a card on top of their deck`;
  }
  return `${player.name} put ${num_cards} card on top of their deck`;
}
