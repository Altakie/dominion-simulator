import type { WSContext } from "hono/ws"
import { MessageKinds, serializeMessage, type ConnectMessage, type DisconnectMessage, type Message, type PlayerNamesMessage } from "shared/messages"
import { Game } from "./game"

export type PlayerLobbyInfo = { clientid: string, socket: WSContext, name: string }

export class Lobby {
  player_lobby_infos: Map<string, PlayerLobbyInfo>
  game?: Game

  constructor() {
    this.player_lobby_infos = new Map()
  }

  add_player(clientid: string, name: string, ws: WSContext) {
    this.player_lobby_infos.set(clientid, {
      name: name,
      clientid: clientid,
      socket: ws,
    })

    let msg: ConnectMessage = {
      kind: MessageKinds.CONNECT,
      player_name: name
    }

    let msg_str = serializeMessage(msg)

    for (let player of this.player_lobby_infos.values()) {
      if (player.clientid === clientid) {
        let msg: PlayerNamesMessage = {
          kind: MessageKinds.PLAYER_NAMES,
          player_names: this.get_player_names()
        }

        player.socket.send(serializeMessage(msg))
        continue
      }

      player.socket.send(msg_str)
    }
  }

  resolve_message(clientid: string, message: Message) {
    switch (message.kind) {
      case MessageKinds.START:
        console.log("Start Message Received")
        // if (players.size > 1) {
        this.game = new Game(this.get_player_lobby_infos())

        this.game.start_game()

        console.log(`Game Started with players: ${JSON.stringify(this.get_player_names())}`)
        // }
        break
      case MessageKinds.PICK_CARDS_RESPONSE:
      case MessageKinds.PICK_SUPPLY_PILE_RESPONSE:
      case MessageKinds.PICK_YES_NO_RESPONSE:
        if (!this.game) {
          break
        }
        if (!this.game.wait_info) {
          console.log("Received player response but game is not waiting")
        }
        this.game.resolve_player_choice(clientid, message)
        break
      default:
        console.log(`Message Kind "${message.kind}" not recognized`)
    }
  }

  remove_player(clientid: string) {
    let name = this.player_lobby_infos.get(clientid)!.name

    let msg: DisconnectMessage = {
      kind: MessageKinds.DISCONNECT,
      player_name: name
    }
    let msg_str = serializeMessage(msg)
    for (let player of this.player_lobby_infos.values()) {
      player.socket.send(msg_str)
    }
    this.player_lobby_infos.delete(clientid)

    console.log(`Player ${clientid} left the game`)
  }

  get_player_names(): string[] {
    return this.player_lobby_infos.values().map((info) => info.name).toArray()
  }

  get_player_lobby_infos(): PlayerLobbyInfo[] {
    return this.player_lobby_infos.values().toArray()
  }

}
