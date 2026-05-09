import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";

const app = new Hono()

// app.use(cors({
//   origin: "*",
//   allowHeaders: ["*"],
//   allowMethods: ["*"],
// }))

app.use(cors())

app.get("/api", (c) => {
  return c.text("Hi!")
})

app.use("/*", serveStatic({ root: "../client/dist" }))

// app.get('/', (context) => {
//   return context.text("Hi!")
// })

export default app
