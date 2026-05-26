import { useEffect, useState, type Dispatch, type SetStateAction, useRef, type RefObject, createContext, useContext } from 'react'
import './App.css'
import { useQuery, useMutation, QueryClient, useQueryClient, } from "@tanstack/react-query"
import { type JSX } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';


export const StateContext = createContext<{
  state: string,
  setState: (s: string) => void
}>(null)
function App() {
  // return (<>
  //   <BrowserRouter>
  //     <Routes>
  //       <Route path='/' element={<Home />}></Route>
  //       <Route path='/game' element={<Game />}></Route>
  //     </Routes>
  //   </BrowserRouter>
  // </>)

  let [state, setState] = useState("Home")


  return <>
    <StateContext value={{ state: state, setState: setState }}>
      {stateTable[state]}
    </StateContext>
  </>
}

let stateTable: Record<string, JSX.Element> = {
  "Home": <Home />,
  "Game": <Game />,
  "Test": <Test />
}

function Test() {
  return <h1>Hi!</h1>
}

function Home() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<string[]>([])
  const [name, setName] = useState("")

  const queryClient = useQueryClient();

  let ws = useMessageSocket()

  let { state, setState } = useContext(StateContext)

  useEffect(() => {
    if (ws.current) {
      ws.current.onmessage = (ev) => {
        let json = JSON.parse(ev.data)
        if (json.msg) {
          setMessages([...messages, json.msg])
        }

        // queryClient.invalidateQueries({
        //   queryKey: ['count']
        // })
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
        <button onClick={() => { setState("Game") }}>
          Join Game
        </button>
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


function useMessageSocket() {
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

function Game() {
  let gameSocket = useGameSocket();
  let { state, setState } = useContext(StateContext)
  return (
    <>
      <h1>Welcome to the game</h1>
      <button onClick={() => { }}>Start Game</button>
      <button onClick={() => {
        setState("Home")
        gameSocket.current.close(1000)
      }}>Leave Game</button>
    </>
  )
}

function useGameSocket() {
  const ws = useRef<WebSocket>(null)
  // new WebSocket('/socket')
  useEffect(
    () => {
      function connect(attempt: number) {
        ws.current = new WebSocket("/game")
        ws.current.onopen = () => {
          console.log("Joined Game!")
        }


        ws.current.onclose = (ev) => {
          console.log(ev.code)
          if (ev.code != 1000) {
            setTimeout(() => connect(attempt + 1), Math.min(2000 ** attempt, 30000))
          }
        }
      }

      connect(0)

      return () => ws.current.close()
    }, []
  )

  return ws
}


export default App
