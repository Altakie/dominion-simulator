import type { WSContext } from "hono/ws";
import {
  type ConnectMessage,
  type DisconnectMessage,
  type Message,
  MessageKinds,
  type PlayerNamesMessage,
  serializeMessage,
} from "shared/messages";
import { Game } from "./game";

export type PlayerLobbyInfo = {
  clientid: string;
  socket: WSContext;
  name: string;
};

export class Lobby {
  player_lobby_infos: Map<string, PlayerLobbyInfo>;
  game?: Game;

  constructor() {
    this.player_lobby_infos = new Map();
  }

  add_player(clientid: string, name: string, ws: WSContext) {
    this.player_lobby_infos.set(clientid, {
      name: name,
      clientid: clientid,
      socket: ws,
    });

    // TODO: Only send connect message to players in lobby
    let players_in_lobby: PlayerLobbyInfo[];
    if (this.game === undefined) {
      players_in_lobby = this.player_lobby_infos.values().toArray();
    } else {
      players_in_lobby = this.player_lobby_infos
        .values()
        .filter(
          (player_lobby_info) =>
            !this.game?.player_infos.some(
              (player_info) =>
                player_info.clientid === player_lobby_info.clientid,
            ),
        )
        .toArray();
    }

    const msg: ConnectMessage = {
      kind: MessageKinds.CONNECT,
      player_name: name,
    };

    const msg_str = serializeMessage(msg);

    for (const player of players_in_lobby) {
      if (player.clientid === clientid) {
        const msg: PlayerNamesMessage = {
          kind: MessageKinds.PLAYER_NAMES,
          player_names: this.get_player_names(),
        };

        player.socket.send(serializeMessage(msg));
        continue;
      }

      player.socket.send(msg_str);
    }
  }

  resolve_message(clientid: string, message: Message) {
    switch (message.kind) {
      case MessageKinds.START:
        console.log("Start Message Received");
        // if (players.size > 1) {
        if (this.game) {
          break;
        }
        this.game = new Game(this.get_player_lobby_infos(), this);

        this.game.start_game();

        console.log(
          `Game Started with players: ${JSON.stringify(this.get_player_names())}`,
        );
        // }
        break;
      case MessageKinds.PICK_CARDS_RESPONSE:
      case MessageKinds.PICK_SUPPLY_PILE_RESPONSE:
      case MessageKinds.PICK_YES_NO_RESPONSE:
        if (!this.game) {
          break;
        }
        if (this.game.wait_queue.isEmpty()) {
          console.log("Received player response but game is not waiting");
        }
        this.game.resolve_player_choice(clientid, message);
        break;
      default:
        console.log(`Message Kind "${message.kind}" not recognized`);
    }
  }

  remove_player(clientid: string) {
    // FIX: Only one message is stored in players so sending disconnect can break everything
    // TODO: Only send disconnect message to players in lobby unless the player who left was in the game
    const name = this.player_lobby_infos.get(clientid)?.name;
    if (name == null) {
      return;
    }

    const msg: DisconnectMessage = {
      kind: MessageKinds.DISCONNECT,
      player_name: name,
    };
    const msg_str = serializeMessage(msg);
    for (const player of this.player_lobby_infos.values()) {
      player.socket.send(msg_str);
    }
    this.player_lobby_infos.delete(clientid);

    console.log(`Player ${clientid} left the game`);
  }

  get_player_names(): string[] {
    return this.player_lobby_infos
      .values()
      .map((info) => info.name)
      .toArray();
  }

  get_player_lobby_infos(): PlayerLobbyInfo[] {
    return this.player_lobby_infos.values().toArray();
  }
}
