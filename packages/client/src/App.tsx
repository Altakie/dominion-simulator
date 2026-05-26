import { useEffect, useState, useRef, createContext, useContext, type RefObject } from 'react'
import './App.css'
import { type JSX } from 'react'
// import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { serializeMessage, MessageKind, parseMessage, type ConnectMessage, type DisconnectMessage, type PlayerNamesMessage } from "shared/messages"


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
  const [messages, setMessages] = useState<string[]>([])
  const [name, setName] = useState("")


  let ws = useMessageSocket()

  let { setState } = useContext(StateContext)

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
          <input value={name} onChange={(e) => setName(e.target.value)
          }
          ></input>
        </p>
        <button onClick={() => {
          setState("Game");
          ws.current.send(name)
        }}>
          Join Game
        </button>
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
        ws.current.onopen = () => {
          console.log("Opened Connection!")
        }


        ws.current.onclose = (ev,) => {
          if (ev.code !== 1000) {
            setTimeout(() => connect(attempt + 1), Math.min(2000 ** attempt, 30000))

          }
        }
      }

      connect(0)

      return () => ws.current.close(1000)
    }, []
  )

  return ws
}

// function MessageLog({ messages }) {
//
//   return (
//     <>
//       {
//         messages.map((message: string) => <p>{message}</p>)
//       }
//     </>
//   )
// }

// function sendMessage(ws: RefObject<WebSocket>, name: string, message: string, setInput: Dispatch<SetStateAction<string>>) {
//   ws.current.send(`[${name}]: ${message}`)
//   setInput("")
// }

function Game() {
  let gameSocket = useGameSocket();
  let { setState } = useContext(StateContext)
  let [player_names, setPlayerNames] = useState<Set<string>>(new Set())

  useEffect(
    () => {
      if (!gameSocket) {
        return
      }
      gameSocket.current.onmessage = (ev) => {
        console.log(`Message: ${ev.data}`)
        let msg = parseMessage(ev.data)
        if (!msg) {
          return
        }

        switch (msg.kind) {
          case MessageKind.PLAYER_NAMES:
            let player_msg = msg as PlayerNamesMessage
            setPlayerNames(new Set(player_msg.player_names))
            console.log(JSON.stringify([...player_names]))
            break
          case MessageKind.CONNECT:
            let conn_msg = msg as ConnectMessage
            setPlayerNames(prev => {
              prev.add(conn_msg.player_name)
              return new Set(prev)
            })
            break
          case MessageKind.DISCONNECT:
            let disconn_msg = msg as DisconnectMessage
            setPlayerNames(prev => {
              prev.delete(disconn_msg.player_name)
              return new Set(prev)
            })
            break
        }
      }
    }
    , [gameSocket]
  )

  return (
    <>
      <h1>Welcome to the game</h1>
      <button onClick={() => {
        console.log("Attempting to start game")
        gameSocket.current.send(serializeMessage({
          kind: MessageKind.START
        }))
      }}>Start Game</button>

      <PlayerLobby players={player_names}></PlayerLobby>

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
          if (ev.code !== 1000) {
            setTimeout(() => connect(attempt + 1), Math.min(2000 ** attempt, 30000))
          }
        }
      }

      connect(0)

      // ws.current.send(serializeMessage({
      //   kind: MessageKind.CONNECT,
      // }))

      return () => ws.current.close()
    }, []
  )

  return ws
}

function PlayerLobby({ players }: { players: Set<string> }) {
  return <>
    <h2>Players:</h2>
    <ul>
      {[...players].map((name) =>
        <li>{name}</li>
      )}
    </ul>
  </>
}


export default App
