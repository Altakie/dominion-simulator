import { randomUUIDv7 } from "bun";
import { type Context, Hono } from "hono";
import { serveStatic, upgradeWebSocket, websocket } from "hono/bun";
import { getCookie, setCookie } from "hono/cookie";
import { cors } from "hono/cors";
import type { WSContext } from "hono/ws";
import {
  type ConnectMessage,
  type DisconnectMessage,
  MessageKinds,
  type PlayerNamesMessage,
  parseMessage,
  serializeMessage,
} from "shared/messages";
import type { Game, PlayerInfo } from "./game";
import { Lobby } from "./lobby";

const app = new Hono();

app.use(cors());
// NOTE: Only use when testing with separate client
// app.use(cors({
//   origin: "*"
// }))

function getClientId(c: Context): string | undefined {
  return getCookie(c, "clientid");
}

const webby: Map<string, WSContext> = new Map();
const names: Map<string, string> = new Map();

app.use(
  "/socket",
  upgradeWebSocket((c) => {
    return {
      onOpen: async (_ev, ws) => {
        const clientid = getCookie(c, "clientid");
        if (!clientid) {
          return;
        }

        webby.set(clientid, ws);
      },
      onMessage: async (event, _ws) => {
        const clientid = getClientId(c);
        if (!clientid) {
          return;
        }
        const name = event.data.toString();
        // serverMessage = msg
        console.log(`Name received: ${name}`);
        names.set(clientid, name);
        // for (let value of webby.values()) {
        //   value.send(JSON.stringify({
        //     msg: msg,
        //   }))
        // }
      },
      onClose: () => {
        console.log("Closed :(");
      },
    };
  }),
);

const lobby = new Lobby();
let game: Game;

app.use(
  "/game",
  upgradeWebSocket((c) => {
    return {
      onOpen: async (_ev, ws) => {
        const clientid = getClientId(c);
        if (!clientid) {
          return;
        }

        webby.set(clientid, ws);

        const name = names.get(clientid);
        if (!name) {
          console.log("No Name");
          return;
        }

        lobby.add_player(clientid, name, ws);

        console.log(`Player ${clientid} joined the game`);
        console.log(`Players: ${JSON.stringify(lobby.get_player_names())}`);
      },
      onMessage: (ev, ws) => {
        const clientid = getClientId(c);
        if (!clientid) {
          return;
        }
        const message = parseMessage(ev.data.toString());
        if (!message) {
          console.log("Message rejected");
          return;
        }

        // NOTE: This is where player responses are resolved, other messages are resolved below
        lobby.resolve_message(clientid, message);
      },
      onClose: async () => {
        const clientid = getClientId(c);
        if (!clientid) {
          return;
        }

        lobby.remove_player(clientid);
      },
    };
  }),
);

app.use("/*", (c, next) => {
  const existing = getClientId(c);
  if (!existing) {
    setCookie(c, "clientid", randomUUIDv7(), {
      httpOnly: true,
    });
  }

  return next();
});

app.use("/*", serveStatic({ root: "../client/dist" }));

// app.get('/', (context) => {
//   return context.text("Hi!")
// })

export default {
  hostname: "0.0.0.0",
  port: 3000,
  fetch: app.fetch,
  websocket,
};
