import { useEffect, useState, type Dispatch, type SetStateAction, useRef, type RefObject } from 'react'
import './App.css'
import { useQuery, useMutation, QueryClient, useQueryClient, } from "@tanstack/react-query"


function App() {
  const [count, setCount] = useState(0)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<string[]>([])
  const [name, setName] = useState("")

  const queryClient = useQueryClient();

  const { mutate: updateCount } = useMutation(
    {
      mutationKey: ['count'],
      mutationFn: async (count: number) => {
        return await fetch("/count", {
          method: "PUT",
          body: count.toString(),
        })
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['count'] })
      }
    }
  )

  let ws = useWebSocket()

  useEffect(() => {
    if (ws.current) {
      ws.current.onmessage = (ev) => {
        let json = JSON.parse(ev.data)
        if (json.msg) {
          setMessages([...messages, json.msg])
        }
        setCount(json.count)

        queryClient.invalidateQueries({
          queryKey: ['count']
        })
      }
    }
  }
    , [ws, messages])


  // ws.send("Skeeby Deeby")

  return (
    <>
      <section id='center'>

        <p>Your Name:
          <input value={name} onChange={(e) => setName(e.target.value)}
          ></input>
        </p>
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
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(ev) => {
            if (ev.key == 'Enter') {
              sendMessage(ws, name, input, setInput)
            }
          }}
        ></input>
        <button onClick={() => {
          sendMessage(ws, name, input, setInput)
        }}>WebSocket Send</button>
        <MessageLog messages={messages} />
      </section>
    </>
  )
}

function ServerRes() {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["Server"], queryFn: async () => {

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

function useWebSocket() {
  const ws = useRef<WebSocket>(null)
  // new WebSocket('/socket')
  useEffect(
    () => {
      function connect(attempt: number) {
        ws.current = new WebSocket("/socket")
        ws.current.onopen = (ev) => {
          console.log("Opened Connection!")
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

function MessageLog({ messages }) {

  return (
    <>
      {
        messages.map((message: string) => <p>{message}</p>)
      }
    </>
  )
}

function sendMessage(ws: RefObject<WebSocket>, name: string, message: string, setInput: Dispatch<SetStateAction<string>>) {
  ws.current.send(`[${name}]: ${message}`)
  setInput("")
}


export default App
