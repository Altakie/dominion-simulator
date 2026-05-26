// type ServerMessage = 

// type ClientMessage = 
export const MessageKind = Object.freeze({
  CONNECT: "Connect",
  DISCONNECT: "Disconnect",
  PLAYER_NAMES: "Player Names",
  START: "Start",
  STARTED: "Started",
})

type MessageKinds = typeof MessageKind[keyof typeof MessageKind]


interface Message {
  kind: MessageKinds,
}

export interface ConnectMessage extends Message {
  kind: typeof MessageKind.CONNECT,
  player_name: string,
}

export interface DisconnectMessage extends Message {
  kind: typeof MessageKind.DISCONNECT,
  player_name: string,
}

export interface PlayerNamesMessage extends Message {
  kind: typeof MessageKind.PLAYER_NAMES,
  player_names: string[],
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
