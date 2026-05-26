import { useEffect, useState, useRef, createContext, useContext, type RefObject } from 'react'
import './App.css'
import { type JSX } from 'react'
import { Lobby } from './Lobby.tsx'
import { Game } from './Game.tsx'
// import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';


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
  "Game": <Lobby />,
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



export default App
