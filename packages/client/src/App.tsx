import { useEffect, useState, type Dispatch, type SetStateAction, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { useQuery, useMutation, QueryClient, useQueryClient, } from "@tanstack/react-query"


function App() {
  const [count, setCount] = useState(0)
  const [msg, setMessage] = useState("")
  const [input, setInput] = useState("")

  const queryClient = useQueryClient();

  const { mutate: updateCount } = useMutation(
    {
      mutationKey: ['count'],
      mutationFn: async (count: number) => {
        return await fetch("/count", {
          method: "POST",
          body: count.toString(),
        })
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['count'] })
      }
    }
  )

  let ws = useWebSocket(setMessage, setCount, queryClient)



  // ws.send("Skeeby Deeby")

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>Server Message: {msg}</p>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <input value={input} onChange={(e) => setInput(e.target.value)}></input>
        <button onClick={() => {
          ws.current.send(input)
          setInput("")
        }}>WebSocket Send</button>
        <button
          type="button"
          className="counter"
          onClick={() => {
            updateCount(count + 1)
            setCount(count + 1)
          }
          }
        >
          <ServerCount setCount={setCount}>
          </ServerCount>
          {/* Count is {count} */}
        </button>
        <p>Server says <ServerRes /></p>

        <div className="ticks"></div>

        <section id="next-steps">
          <div id="docs">
            <svg className="icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#documentation-icon"></use>
            </svg>
            <h2>Documentation</h2>
            <p>Your questions, answered</p>
            <ul>
              <li>
                <a href="https://vite.dev/" target="_blank">
                  <img className="logo" src={viteLogo} alt="" />
                  Explore Vite
                </a>
              </li>
              <li>
                <a href="https://react.dev/" target="_blank">
                  <img className="button-icon" src={reactLogo} alt="" />
                  Learn more
                </a>
              </li>
            </ul>
          </div>
          <div id="social">
            <svg className="icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#social-icon"></use>
            </svg>
            <h2>Connect with us</h2>
            <p>Join the Vite community</p>
            <ul>
              <li>
                <a href="https://github.com/vitejs/vite" target="_blank">
                  <svg
                    className="button-icon"
                    role="presentation"
                    aria-hidden="true"
                  >
                    <use href="/icons.svg#github-icon"></use>
                  </svg>
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://chat.vite.dev/" target="_blank">
                  <svg
                    className="button-icon"
                    role="presentation"
                    aria-hidden="true"
                  >
                    <use href="/icons.svg#discord-icon"></use>
                  </svg>
                  Discord
                </a>
              </li>
              <li>
                <a href="https://x.com/vite_js" target="_blank">
                  <svg
                    className="button-icon"
                    role="presentation"
                    aria-hidden="true"
                  >
                    <use href="/icons.svg#x-icon"></use>
                  </svg>
                  X.com
                </a>
              </li>
              <li>
                <a href="https://bsky.app/profile/vite.dev" target="_blank">
                  <svg
                    className="button-icon"
                    role="presentation"
                    aria-hidden="true"
                  >
                    <use href="/icons.svg#bluesky-icon"></use>
                  </svg>
                  Bluesky
                </a>
              </li>
            </ul>
          </div>
        </section>

        <div className="ticks"></div>
        <section id="spacer"></section>
      </section>
    </>
  )
}

function ServerRes() {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["Server"], queryFn: async () => {
      // const ws = new WebSocket("http://localhost:3000/api")
      // ws.onmessage = (event) => {
      //   new Response(event.data).text().then((s) => {
      //     setRes(s)
      //   })
      // }
      //
      // return () => ws.close()

      return fetch("/api").then((r) => r.text().then(
        (t) => {
          return t
        }
      ))
    }
  })

  if (isPending) {
    return "Pending"
  }

  if (isError) {
    return "Error"
  }

  return data
}



function ServerCount({ setCount }) {
  const { isFetching, data } = useQuery(
    {
      queryKey: ['count'],
      queryFn: async () => {
        // await new Promise((r) => setTimeout(r, 1000))
        return fetch("/count").then((r) => r.text())
      }
    }
  )

  if (isFetching) {
    return <Loading></Loading>
  }

  setCount(parseInt(data))
  return <h2>{data}apus</h2>
}

function Loading() {
  return <h2>Loading...adeek</h2>;
}

// function Socket({ws}) {
//   ws.send("Skeeby Deeby")
// }

function useWebSocket(setMessage, setCount, queryClient) {
  const ws = useRef<WebSocket>(null)
  // new WebSocket('/socket')
  useEffect(
    () => {
      function connect(attempt: number) {
        ws.current = new WebSocket("/socket")
        ws.current.onopen = () => {
          console.log("Opened Connection!")
        }

        ws.current.onmessage = (ev) => {
          let json = JSON.parse(ev.data)
          setMessage(json.msg)
          setCount(json.count)
          queryClient.invalidateQueries({
            queryKey: ['count']
          })
        }

        ws.current.onclose = () => {
          setTimeout(() => connect(attempt + 1), Math.min(2000 ** attempt, 30000))
        }
      }

      connect(0)

      return () => ws.current.close()
    }, []
  )

  return ws
}

export default App
