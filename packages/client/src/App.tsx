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

  addEventListener


  // ws.send("Skeeby Deeby")

  return (
    <>
      <section id='center'>

        <p>Server Message: {msg}</p>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(ev) => {
            if (ev.key == 'Enter') {
              ws.current.send(input)
              setInput("")
            }
          }}
        ></input>
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
