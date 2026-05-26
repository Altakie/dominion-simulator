import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic, websocket } from "hono/bun";
import { upgradeWebSocket } from "hono/bun";
import { WSContext } from "hono/ws";
import { type Context } from "hono";
import { setCookie, getCookie } from "hono/cookie";
import { parseMessage, MessageKind, serializeMessage, type PlayerNamesMessage, type ConnectMessage, type DisconnectMessage, type StartedMessage } from "shared/messages"
import type { PlayerInfo } from "./game";
import { Game } from "./game";
import { new_player } from "shared";
import { randomUUIDv7 } from "bun";


const app = new Hono()

app.use(cors())

function getClientId(c: Context): string | undefined {
  return getCookie(c, 'clientid')
}



let webby: Map<string, WSContext> = new Map();
let names: Map<string, string> = new Map();

app.use("/socket", upgradeWebSocket((c) => {
  return {
    onOpen: async (_ev, ws) => {
      const clientid = getCookie(c, 'clientid')
      if (!clientid) {
        return
      }

      webby.set(clientid, ws)
    },
    onMessage: async (event, _ws) => {
      let clientid = getClientId(c)
      if (!clientid) {
        return
      }
      let name = event.data.toString()
      // serverMessage = msg
      console.log(`Name received: ${name}`)
      names.set(clientid, name)
      // for (let value of webby.values()) {
      //   value.send(JSON.stringify({
      //     msg: msg,
      //   }))
      // }
    },
    onClose: () => {
      console.log("Closed :(")
    }
  }
}))

let players: Map<string, PlayerInfo> = new Map()
let game: Game;

app.use("/game", upgradeWebSocket((c,) => {
  return {
    onOpen: async (_ev, ws) => {
      const clientid = getClientId(c)
      if (!clientid) {
        return
      }

      webby.set(clientid, ws)

      let name = names.get(clientid);
      if (!name) {
        console.log("No Name")
        return
      }

      players.set(clientid, {
        socket: ws,
        clientid: clientid,
        player: new_player(name)
      })

      console.log(`Player ${clientid} joined the game`)
      console.log(`Players: ${JSON.stringify([...players.values()].map((player) => player.player.name))}`)

      let msg: ConnectMessage = {
        kind: MessageKind.CONNECT,
        player_name: name
      }

      let msg_str = serializeMessage(msg)

      for (let player of players.values()) {
        if (player.clientid === clientid) {
          let msg: PlayerNamesMessage = {
            kind: MessageKind.PLAYER_NAMES,
            player_names: players.values().map((player) => player.player.name).toArray()
          }

          player.socket.send(serializeMessage(msg))
          continue
        }

        player.socket.send(msg_str)
      }
    },
    onMessage: (ev, ws) => {
      let clientid = getClientId(c)
      if (!clientid) {
        return
      }
      let message = parseMessage(ev.data.toString())
      if (!message) {
        console.log("Message rejected")
        return
      }

      switch (message.kind) {
        case MessageKind.START:
          console.log("Start Message Received")
          // if (players.size > 1) {
          game = new Game(players.values().toArray())

          const started_msg: StartedMessage = {
            kind: MessageKind.STARTED,
            player_name_order: game.get_player_names(),
            state: game.state
          }

          const started_msg_str = serializeMessage(started_msg)

          for (let player of players.values()) {
            player.socket.send(started_msg_str)
          }

          let player_names = players.values().map((player) => player.player.name).toArray()
          console.log(`Game Started with players: ${JSON.stringify(player_names)}`)
          // }
          break
      }
    },
    onClose: async () => {
      const clientid = getClientId(c)
      if (!clientid) {
        return
      }

      let name = names.get(clientid)!

      let msg: DisconnectMessage = {
        kind: MessageKind.DISCONNECT,
        player_name: name
      }
      let msg_str = serializeMessage(msg)
      for (let player of players.values()) {
        player.socket.send(msg_str)
      }

      players.delete(clientid)
      console.log(`Player ${clientid} left the game`)
    },
  }
}
))

app.use("/*", (c, next) => {
  const existing = getClientId(c)
  if (!existing) {
    setCookie(c, 'clientid', randomUUIDv7(), {
      httpOnly: true,
    })
  }

  return next()
})

app.use("/*", serveStatic({ root: "../client/dist" }))


// app.get('/', (context) => {
//   return context.text("Hi!")
// })

export default {
  hostname: '0.0.0.0',
  port: 3000,
  fetch: app.fetch,
  websocket,
}
