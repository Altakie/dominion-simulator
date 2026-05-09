import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic, websocket } from "hono/bun";
import { upgradeWebSocket } from "hono/bun";
import { format } from "util";
import { WSContext } from "hono/ws";

const app = new Hono()

// app.use(cors({
//   origin: "*",
//   allowHeaders: ["*"],
//   allowMethods: ["*"],
// }))

app.use(cors())

let count = 0

app.get("/api", (c) => {
  return c.text("Hi! " + count)
})

app.get("/count", (c) => {
  return c.text(count.toString())
})

let webby: WSContext;

app.post("/count", async (c) => {
  let text = await c.req.text()
  count = parseInt(text)
  webby.send(JSON.stringify({
    msg: "Here's the count!",
    count: count
  }))
  return c.text(count.toString())
})

app.use("/socket", upgradeWebSocket((c) => {
  return {
    onOpen: async (event, ws) => {
      webby = ws
    },
    onMessage: async (event, ws) => {
      let msg = event.data.toString()
      console.log("Message data: %s", msg)
      let json = JSON.stringify({
        msg: "Hi Client!",
        count: count
      })
      ws.send(json)
      await new Promise((r) => setTimeout(r, 1000))
      json = JSON.stringify({
        msg: format("Your message was %s characters long", msg.length),
        count: count
      })
      ws.send(json)
    },
    onClose: () => {
      console.log("Closed :(")
    }
  }
}))


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
