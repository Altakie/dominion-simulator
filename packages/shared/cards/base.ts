import { type CardInfo, CardTypes } from "../cards";

export type BaseName =
  | "Cellar"
  | "Chapel"
  | "Moat"
  | "Harbinger"
  | "Merchant"
  | "Vassal"
  | "Village"
  | "Workshop"
  | "Bureaucrat"
  | "Gardens"
  | "Militia"
  | "Moneylender"
  | "Poacher"
  | "Remodel"
  | "Smithy"
  | "Throne Room"
  | "Bandit"
  | "Council Room"
  | "Festival"
  | "Laboratory"
  | "Library"
  | "Market"
  | "Mine"
  | "Sentry"
  | "Witch"
  | "Artisan";

export const Cellar: CardInfo = {
  name: "Cellar",
  types: [CardTypes.ACTION],
  cost: 2,
};

export const Chapel: CardInfo = {
  name: "Chapel",
  types: [CardTypes.ACTION],
  cost: 2,
};

export const Moat: CardInfo = {
  name: "Moat",
  types: [CardTypes.ACTION, CardTypes.REACTION],
  cost: 2,
};

export const Harbinger: CardInfo = {
  name: "Harbinger",
  types: [CardTypes.ACTION],
  cost: 3,
};

export const Merchant: CardInfo = {
  name: "Merchant",
  types: [CardTypes.ACTION],
  cost: 3,
};

export const Vassal: CardInfo = {
  name: "Vassal",
  types: [CardTypes.ACTION],
  cost: 3,
};

export const Village: CardInfo = {
  name: "Village",
  types: [CardTypes.ACTION],
  cost: 3,
};

export const Workshop: CardInfo = {
  name: "Workshop",
  types: [CardTypes.ACTION],
  cost: 3,
};

export const Bureaucrat: CardInfo = {
  name: "Bureaucrat",
  types: [CardTypes.ACTION],
  cost: 4,
};

export const Gardens: CardInfo = {
  name: "Gardens",
  types: [CardTypes.VICTORY],
  cost: 4,
};

export const Militia: CardInfo = {
  name: "Militia",
  types: [CardTypes.ACTION],
  cost: 4,
};

export const Moneylender: CardInfo = {
  name: "Moneylender",
  types: [CardTypes.ACTION],
  cost: 4,
};

export const Poacher: CardInfo = {
  name: "Poacher",
  types: [CardTypes.ACTION],
  cost: 4,
};

export const Remodel: CardInfo = {
  name: "Remodel",
  types: [CardTypes.ACTION],
  cost: 4,
};

export const Smithy: CardInfo = {
  name: "Smithy",
  types: [CardTypes.ACTION],
  cost: 4,
};

export const ThroneRoom: CardInfo = {
  name: "Throne Room",
  types: [CardTypes.ACTION],
  cost: 4,
};

export const Bandit: CardInfo = {
  name: "Bandit",
  types: [CardTypes.ACTION],
  cost: 5,
};

export const CouncilRoom: CardInfo = {
  name: "Council Room",
  types: [CardTypes.ACTION],
  cost: 5,
};

export const Festival: CardInfo = {
  name: "Festival",
  types: [CardTypes.ACTION],
  cost: 5,
};

export const Laboratory: CardInfo = {
  name: "Laboratory",
  types: [CardTypes.ACTION],
  cost: 5,
};

export const Library: CardInfo = {
  name: "Library",
  types: [CardTypes.ACTION],
  cost: 5,
};

export const Market: CardInfo = {
  name: "Market",
  types: [CardTypes.ACTION],
  cost: 5,
};

export const Mine: CardInfo = {
  name: "Mine",
  types: [CardTypes.ACTION],
  cost: 5,
};

export const Sentry: CardInfo = {
  name: "Sentry",
  types: [CardTypes.ACTION],
  cost: 5,
};

export const Witch: CardInfo = {
  name: "Witch",
  types: [CardTypes.ACTION],
  cost: 5,
};

export const Artisan: CardInfo = {
  name: "Artisan",
  types: [CardTypes.ACTION],
  cost: 6,
};

export const BaseCards: CardInfo[] = [
  Cellar,
  Chapel,
  Moat,
  Harbinger,
  Merchant,
  Vassal,
  Village,
  Workshop,
  Bureaucrat,
  Gardens,
  Militia,
  Moneylender,
  Poacher,
  Remodel,
  Smithy,
  ThroneRoom,
  Bandit,
  CouncilRoom,
  Festival,
  Laboratory,
  Library,
  Market,
  Mine,
  Sentry,
  Witch,
  Artisan,
];
