import { serializeMessage, MessageKind, parseMessage, type ConnectMessage, type DisconnectMessage, type PlayerNamesMessage, type StartedMessage } from "shared/messages"
import { useEffect, useState, useRef, useContext } from 'react'
import { StateContext } from "./App";
import './App.css'
import { Game } from "./Game.tsx"

export function Lobby() {
  let gameSocket = useGameSocket();
  let { setState } = useContext(StateContext)
  let [player_names, setPlayerNames] = useState<Set<string>>(new Set())
  let [player_names_in_order, setPlayerNamesInOrder] = useState<string[]>([])
  let [gameStarted, setGameStarted] = useState(false);
  let [gameState, setGameState] = useState(null)

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
          case MessageKind.STARTED:
            let started_msg = msg as StartedMessage
            setPlayerNamesInOrder(started_msg.player_name_order)
            setGameState(started_msg.state)
            setGameStarted(true)
        }
      }
    }
    , [gameSocket]
  )

  if (!gameStarted) {
    return (
      <>
        <h1>Welcome to the game</h1>
        <button onClick={() => {
          console.log("Attempting to start game")
          gameSocket.current.send(serializeMessage({
            kind: MessageKind.START
          }))
        }}>Start Game</button>

        <PlayerList players={player_names}></PlayerList>

        <button onClick={() => {
          setState("Home")
          gameSocket.current.close(1000)
        }}>Leave Game</button>
      </>
    )
  } else {
    return <Game players={[...player_names]} game_state={gameState} />
  }

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

function PlayerList({ players }: { players: Set<string> }) {
  return <>
    <h2>Players:</h2>
    <ul>
      {[...players].map((name) =>
        <li>{name}</li>
      )}
    </ul>
  </>
}
