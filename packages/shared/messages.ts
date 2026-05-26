import type { GameState } from "."
import type { Card } from "./cards"
import type { Supply, supplyStack } from "./supply"

export const MessageKinds = Object.freeze({
  CONNECT: "Connect",
  DISCONNECT: "Disconnect",
  PLAYER_NAMES: "Player Names",
  START: "Start",
  STARTED: "Started",

  PICK_CARDS_REQUEST: "Pick Cards Request",
  PICK_SUPPLY_PILE_REQUEST: "Pick Supply Pile Request",
  PICK_YES_NO_REQUEST: "Pick Yes No Request",

  PICK_CARDS_RESPONSE: "Pick Cards Response",
  PICK_SUPPLY_PILE_RESPONSE: "Pick Supply Pile Response",
  PICK_YES_NO_RESPONSE: "Pick Yes No Response"
})

type MessageKind = typeof MessageKinds[keyof typeof MessageKinds]


interface Message {
  kind: MessageKind,
}

export interface ConnectMessage extends Message {
  kind: typeof MessageKinds.CONNECT,
  player_name: string,
}

export interface DisconnectMessage extends Message {
  kind: typeof MessageKinds.DISCONNECT,
  player_name: string,
}

export interface PlayerNamesMessage extends Message {
  kind: typeof MessageKinds.PLAYER_NAMES,
  player_names: string[],
}

export interface StartedMessage extends Message {
  kind: typeof MessageKinds.STARTED,
  player_name_order: string[],
  state: GameState,
}

export interface PickCardsRequest extends Message {
  kind: typeof MessageKinds.PICK_CARDS_REQUEST,

  description: string,

  choices: Card[],
  min: number,
  max: number
}

export interface PickSupplyPileRequest extends Message {
  kind: typeof MessageKinds.PICK_SUPPLY_PILE_REQUEST,

  description: string,

  choices: supplyStack,
  min: number,
  max: number
}

export interface PickYesNoRequest extends Message {
  kind: typeof MessageKinds.PICK_YES_NO_REQUEST

  description: string,
}

export type Response = PickCardResponse | PickSupplyPileResponse | PickYesNoResponse

export interface PickCardResponse extends Message {
  kind: typeof MessageKinds.PICK_CARDS_RESPONSE,

  choices: Card[],
}

export interface PickSupplyPileResponse extends Message {
  kind: typeof MessageKinds.PICK_SUPPLY_PILE_RESPONSE,

  choices: supplyStack,
}

export interface PickYesNoResponse extends Message {
  kind: typeof MessageKinds.PICK_YES_NO_RESPONSE
}

//
// export interface StartMessage extends Message {
//   kind: typeof MessageKind.START,
// }
//
// export interface StartedMessage extends Message {
//   kind: typeof MessageKind.STARTED,
// }

export function serializeMessage(msg: Message): string {
  return JSON.stringify(msg)
}


export function parseMessage(msg: string): Message | undefined {
  let parsed = JSON.parse(msg)
  if (!parsed.kind) {
    return undefined
  }

  return parsed
}
