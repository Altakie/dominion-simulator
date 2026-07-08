import type { CardName } from "./cards";

export const description_table: Record<CardName, string> = {
  Copper: "+1 Money when played.",
  Silver: "+2 Money when played.",
  Gold: "+3 Money when played.",
  Estate: "+1 VP at the end of the game.",
  Duchy: "+3 VP at the end of the game.",
  Province: "+6 VP at the end of the game.",
  Gardens: "Worth 1 VP per 10 cards you have (round down).",
  Curse: "-1 VP at the end of the game.",
  Cellar: "+1 Action. Discard any number of cards. +1 Card per card discarded.",
  Chapel: "Trash up to 4 cards from your hand.",
  Moat: "+2 Cards. When another player plays an Attack card, you may first reveal this from your hand, to be unaffected by it",
  Harbinger:
    "+1 Card, +1 Action. Look through your discard pile. You may put a card from it onto your deck.",
  Merchant:
    "+1 Card, +1 Action. The first time you play a Silver this turn, +1 Money.",
  Vassal:
    "+2 Money. Discard the top card of your deck. If it's an action card, you may play it.",
  Village: "+1 Card, +2 Actions.",
  Workshop: "Gain a card costing up to 4 Money.",
  Bureaucrat:
    "Gain a Silver onto your deck. Each other player reveals a Victory card from their hand and puts it onto their deck (or reveals a hand with no victory cards).",
  Militia: "+2 Money. Each other player discards down to 3 cards in hand.",
  Moneylender: "You may trash a Copper from your hand for +3 Money.",
  Poacher: "+1 Card, +1 Action, +1 Money. Discard a card per empty supply pile",
  Remodel:
    "Trash a card from your hand. Gain a card costing up to 2 Money more than it.",
  Smithy: "+3 Cards.",
  "Throne Room": "You may play an Action card from your hand twice.",
  Bandit:
    "Gain a Gold. Each other player reveals the top 2 cards of their deck, trashes a revealed Treasure other than Copper, and discards the rest.",
  "Council Room": "+4 Cards, +1 Buy. Each other player draws a card.",
  Festival: "+2 Actions, +1 Buy, +2 Money.",
  Laboratory: "+2 Cards, +1 Action",
  Library:
    "Draw until you have 7 cards in hand, skipping any Action cards you choose to; set those aside, discarding them afterwards.",
  Market: "+1 Card, +1 Action, +1 Buy, +1 Money.",
  Mine: "You may trash a Treasure from your hand. Gain a Treasure to your hand costing up to 3 Money more than it.",
  Sentry:
    "+1 Card, +1 Action. Look at the top 2 cards of your deck. Trash and/or discard any number of them. Put the rest back on top in any order.",
  Witch: "+2 Cards. Each other player gains a Curse.",
  Artisan:
    "Gain a card to your hand costing up to 5 Money. Put a card from your hand back onto your deck.",
};
