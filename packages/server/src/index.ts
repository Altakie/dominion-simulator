import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic, websocket } from "hono/bun";
import { upgradeWebSocket } from "hono/bun";
import { WSContext } from "hono/ws";
import { setCookie, getCookie } from "hono/cookie";

const app = new Hono()

// app.use(cors({
//   origin: "*",
//   allowHeaders: ["*"],
//   allowMethods: ["*"],
// }))

app.use(cors())

let count = 0
let clientid = 0
let messages: string[] = []

app.get("/api", (c) => {
  return c.text("Hi! " + count)
})

app.get("/count", (c) => {
  return c.text(count.toString())
})

let webby: Map<string, WSContext> = new Map();

app.put("/count", async (c) => {

  let text = await c.req.text()
  count = parseInt(text)
  for (let value of webby.values()) {
    value.send(JSON.stringify({
      // msg: "Here's the count! " + count,
      // msg: serverMessage,
      count: count
    }))
  }
  return c.text(count.toString())
})

app.use("/socket", upgradeWebSocket((c) => {
  return {
    onOpen: async (ev, ws) => {
      const clientid = getCookie(c, 'clientid')
      if (!clientid) {
        ws.send(JSON.stringify({
          msg: "No clientid",
          count: count,
        }))

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
          count: count
        }))
      }
      // await new Promise((r) => setTimeout(r, 1000))
      // json = JSON.stringify({
      //   msg: format("Your message was %s characters long", msg.length),
      //   count: count
      // })
      // ws.send(json)
    },
    onClose: () => {
      console.log("Closed :(")
    }
  }
}))

app.use("/*", (c, next) => {
  const existing = getCookie(c, 'clientid')
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
