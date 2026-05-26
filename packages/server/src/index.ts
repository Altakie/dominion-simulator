import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic, websocket } from "hono/bun";
import { upgradeWebSocket } from "hono/bun";
import { WSContext } from "hono/ws";
import { type Context } from "hono";
import { setCookie, getCookie } from "hono/cookie";


const app = new Hono()

app.use(cors())

function getClientId(c: Context): string | undefined {
  return getCookie(c, 'clientid')
}


let clientid = 0
let messages: string[] = []

let webby: Map<string, WSContext> = new Map();

app.use("/socket", upgradeWebSocket((c) => {
  return {
    onOpen: async (ev, ws) => {
      const clientid = getCookie(c, 'clientid')
      if (!clientid) {
        return
      }

      webby.set(clientid, ws)
    },
    onMessage: async (event, ws) => {
      let msg = event.data.toString()
      // serverMessage = msg
      console.log("Message data: %s", msg)
      messages.push(msg)
      for (let value of webby.values()) {
        value.send(JSON.stringify({
          msg: msg,
        }))
      }
    },
    onClose: () => {
      console.log("Closed :(")
    }
  }
}))

app.use("/game", upgradeWebSocket((c,) => {
  return {
    onOpen: async (ev, ws) => {
      const clientid = getClientId(c)
      if (!clientid) {
        return
      }
      console.log(`Player ${clientid} joined the game`)
    },
    onClose: async () => {
      const clientid = getClientId(c)
      console.log(`Player ${clientid} left the game`)
    },
  }
}
))

app.use("/*", (c, next) => {
  const existing = getClientId(c)
  if (!existing) {
    setCookie(c, 'clientid', clientid.toString(), {
      httpOnly: true,
    })
    clientid++
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
