import { randomUUIDv7 } from "bun";
import { config } from "dotenv";
import { type Context, Hono } from "hono";
import { serveStatic, upgradeWebSocket, websocket } from "hono/bun";
import { getCookie, setCookie } from "hono/cookie";
import { cors } from "hono/cors";
import type { WSContext } from "hono/ws";
import { parseMessage } from "shared/messages";
import { Lobby } from "./lobby";

config();
const app = new Hono();

app.use(cors());
// NOTE: Only use when testing with separate client
// app.use(cors({
//   origin: "*"
// }))

function getClientId(c: Context): string | undefined {
  return getCookie(c, "clientid");
}

const names: Map<string, string> = new Map();

const lobby = new Lobby();

app.put("/names", async (c) => {
  const name = await c.req.text();
  if (lobby.player_lobby_infos.values().some((pli) => pli.name === name)) {
    c.status(406);
    return c.body("Name is already taken");
  }

  let clientid = getCookie(c, "clientid");
  if (!clientid) {
    clientid = randomUUIDv7();
    setCookie(c, "clientid", clientid, {
      httpOnly: true,
    });
  }

  console.log(`Name received: ${name}`);
  names.set(clientid, name);
  c.status(200);
  return c.res;
});

app.use(
  "/game",
  upgradeWebSocket((c) => {
    return {
      onOpen: async (_ev, ws) => {
        const clientid = getClientId(c);
        // Reject improper connections
        if (!clientid) {
          ws.close(1000);
          return;
        }

        const name = names.get(clientid);
        if (!name) {
          console.log("No Name");
          ws.close(1000);
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
