import type {
  GameState,
  Player,
  PlayerDisplayInfo,
  PlayerEndInfo,
  SharablePlayer,
} from ".";
import type { Card } from "./cards";
import type {
  BinaryDescription,
  GainDescription,
  PickCardsDescription,
} from "./effect_descriptions";
import type { LogEntry, Turn } from "./log";
import type { supplyStack } from "./supply";

export const MessageKinds = Object.freeze({
  // Lobby Messages
  CONNECT: "Connect",
  DISCONNECT: "Disconnect",
  PLAYER_NAMES: "Player Names",
  START: "Start",
  STARTED: "Started",
  KICK_PLAYER: "Kick Player",
  ADD_AI_PLAYER: "Add AI Player",

  // Game Messages
  GAME_STATE_UPDATE: "Game State Update",

  PICK_CARDS_REQUEST: "Pick Cards Request",
  PICK_SUPPLY_PILE_REQUEST: "Pick Supply Pile Request",
  PICK_YES_NO_REQUEST: "Pick Yes No Request",

  PICK_CARDS_RESPONSE: "Pick Cards Response",
  PICK_SUPPLY_PILE_RESPONSE: "Pick Supply Pile Response",
  PICK_YES_NO_RESPONSE: "Pick Yes No Response",

  GAME_END: "Game has been terminated",

  LOG_EVENT: "Log Event",
  NEW_TURN: "New Log Turn",
  SYNC_LOG: "Sync Log",
});

type MessageKind = (typeof MessageKinds)[keyof typeof MessageKinds];

export interface Message {
  kind: MessageKind;
}

export interface ConnectMessage extends Message {
  kind: typeof MessageKinds.CONNECT;
  player_name: string;
}

export interface KickPlayerMessage extends Message {
  kind: typeof MessageKinds.KICK_PLAYER;
  player_name: string;
}

export interface AddAIPlayerMessage extends Message {
  kind: typeof MessageKinds.ADD_AI_PLAYER;
}

export interface DisconnectMessage extends Message {
  kind: typeof MessageKinds.DISCONNECT;
  player_name: string;
}

export interface PlayerNamesMessage extends Message {
  kind: typeof MessageKinds.PLAYER_NAMES;
  player_names: string[];
}

export interface StartedMessage extends Message {
  kind: typeof MessageKinds.STARTED;
  players: PlayerDisplayInfo[];
  state: GameState;

  player: SharablePlayer;
}

export const request_message_kinds = new Set<MessageKind>();
request_message_kinds.add(MessageKinds.PICK_CARDS_REQUEST);
request_message_kinds.add(MessageKinds.PICK_SUPPLY_PILE_REQUEST);
request_message_kinds.add(MessageKinds.PICK_YES_NO_REQUEST);

export interface RequestMessage extends Message {
  kind: MessageKind;

  description: string;
}

export interface PickCardsRequest extends RequestMessage {
  kind: typeof MessageKinds.PICK_CARDS_REQUEST;

  description: PickCardsDescription;

  choices: Card[];
  min: number;
  max: number;
}

export interface PickSupplyPileRequest extends RequestMessage {
  kind: typeof MessageKinds.PICK_SUPPLY_PILE_REQUEST;

  description: GainDescription;

  choices: supplyStack[];
  min: number;
  max: number;
}

export interface PickYesNoRequest extends RequestMessage {
  kind: typeof MessageKinds.PICK_YES_NO_REQUEST;

  description: BinaryDescription;

  card: Card;
}

export interface PickCardsResponse extends Message {
  kind: typeof MessageKinds.PICK_CARDS_RESPONSE;

  choices: Card[];
}

export interface PickSupplyPileResponse extends Message {
  kind: typeof MessageKinds.PICK_SUPPLY_PILE_RESPONSE;

  choices: supplyStack[];
}

export interface PickYesNoResponse extends Message {
  kind: typeof MessageKinds.PICK_YES_NO_RESPONSE;

  choice: boolean;
}

export interface GameStateUpdateMessage extends Message {
  kind: typeof MessageKinds.GAME_STATE_UPDATE;

  game_state: GameState;
  player: SharablePlayer;
  players: PlayerDisplayInfo[];
}

export interface GameEndMessage extends Message {
  kind: typeof MessageKinds.GAME_END;

  players_end_infos_in_victory_order: PlayerEndInfo[];
}

export interface LogEventMessage extends Message {
  kind: typeof MessageKinds.LOG_EVENT;

  log_messages: LogEntry[];
}

export interface NewLogTurnMessage extends Message {
  kind: typeof MessageKinds.NEW_TURN;

  turn: Turn;
}

export interface SyncLogMessage extends Message {
  kind: typeof MessageKinds.SYNC_LOG;

  log: Turn[];
}

export function serializeMessage(msg: Message): string {
  return JSON.stringify(msg);
}

export function parseMessage(msg: string): Message | undefined {
  try {
    const parsed = JSON.parse(msg);
    if (!parsed.kind) {
      return undefined;
    }

    return parsed;
  } catch {
    return undefined;
  }
}
