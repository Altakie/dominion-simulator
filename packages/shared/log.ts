import type { CardInfo } from "./cards";

export class Log {
  log_messages: Turn[];

  constructor() {
    this.log_messages = [];
  }

  new_turn(turn_number: number, active_player_name: string) {
    this.log_messages.push({
      active_player_name: active_player_name,
      turn_number: turn_number,
      events: [],
    });
  }

  log_events(...events: LogEntry[]) {
    this.log_messages[this.log_messages.length - 1]?.events.push(...events);
  }

  get_curr_turn(): Turn {
    return this.log_messages[this.log_messages.length - 1]!;
  }
}

export type Turn = {
  active_player_name: string;
  turn_number: number;
  events: LogEntry[];
};

export const LogEventKinds = Object.freeze({
  PLAYED: "Played",
  DISCARDED: "Discarded",
  GAINED: "Gained",
  TRASHED: "Trashed",
  DREW: "Drew",
  NO_CARDS_TO_DISCARD: "NoCardsToDiscard",
  REVEALED_REACTION: "RevealedReaction",
});

export type LogEventKind = (typeof LogEventKinds)[keyof typeof LogEventKinds];

interface BaseLogEntry {
  player_name: string;
}

interface CardsLogEntry extends BaseLogEntry {
  kind:
    | typeof LogEventKinds.PLAYED
    | typeof LogEventKinds.DISCARDED
    | typeof LogEventKinds.GAINED
    | typeof LogEventKinds.TRASHED;
  cards: CardInfo[];
}

interface DrewLogEntry extends BaseLogEntry {
  kind: typeof LogEventKinds.DREW;
  count: number;
}

interface NoCardsToDiscardLogEntry extends BaseLogEntry {
  kind: typeof LogEventKinds.NO_CARDS_TO_DISCARD;
}

interface RevealedReactionLogEntry extends BaseLogEntry {
  kind: typeof LogEventKinds.REVEALED_REACTION;
  card: CardInfo;
}

export type LogEntry =
  | CardsLogEntry
  | DrewLogEntry
  | NoCardsToDiscardLogEntry
  | RevealedReactionLogEntry;

export type CardsLogEventKind = CardsLogEntry["kind"];
