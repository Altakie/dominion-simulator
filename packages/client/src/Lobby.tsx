import { serializeMessage, MessageKinds, parseMessage, type ConnectMessage, type DisconnectMessage, type PlayerNamesMessage, type StartedMessage } from "shared/messages"
import { useEffect, useState, useRef, useContext, type JSX } from 'react'
import { StateContext } from "./App";
import './App.css'
import { Game } from "./Game.tsx"
import type { GameState } from "shared";

export function Lobby() {
  let [connected, setConnected] = useState(false)
  let gameSocket = useGameSocket(setConnected);
  let { setState } = useContext(StateContext)

  let [player_names, setPlayerNames] = useState<Set<string>>(new Set())
  let [player_names_in_order, setPlayerNamesInOrder] = useState<string[]>([])
  let [gameStarted, setGameStarted] = useState(false)
  let [gameState, setGameState] = useState<GameState>(null)
  let [choices, setChoice] = useState<() => JSX.Element>(null)


  const resolve_message =
    (ev: MessageEvent) => {
      console.log(`Message: ${ev.data}`)
      let message = parseMessage(ev.data)
      if (!message) {
        return
      }

      switch (message.kind) {
        case MessageKinds.PLAYER_NAMES:
          let player_msg = message as PlayerNamesMessage
          setPlayerNames(new Set(player_msg.player_names))
          console.log(JSON.stringify([...player_names]))
          break
        case MessageKinds.CONNECT:
          let conn_msg = message as ConnectMessage
          setPlayerNames(prev => {
            prev.add(conn_msg.player_name)
            return new Set(prev)
          })
          break
        case MessageKinds.DISCONNECT:
          let disconn_msg = message as DisconnectMessage
          setPlayerNames(prev => {
            prev.delete(disconn_msg.player_name)
            return new Set(prev)
          })
          break
        case MessageKinds.STARTED:
          let started_msg = message as StartedMessage
          setPlayerNamesInOrder(started_msg.player_name_order)
          setGameState(started_msg.state)
          setGameStarted(true)
          break
        // case MessageKinds.PICK_CARDS_REQUEST:
        //   // TODO: Extract the list of choices and display them for the user
        //   break
        // case MessageKinds.PICK_SUPPLY_PILE_REQUEST:
        //   break
        // case MessageKinds.PICK_YES_NO_REQUEST:
        //   break
        default:
          console.log(`Message kind ${message.kind} not recognized or implemented`)
          break
      }
    }

  useEffect(
    () => {
      if (!gameSocket) {
        return
      }
      gameSocket.current.onmessage = resolve_message
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
            kind: MessageKinds.START
          }))
        }}
          disabled={(() => { return gameSocket.current == undefined })()}
        >Start Game</button>

        <PlayerList players={player_names} />

        <button onClick={() => {
          setState("Home")
          gameSocket.current.close(1000)
        }}>Leave Game</button>
      </>
    )
  } else {
    return <Game players={[...player_names]} game_state={gameState} Choices={choices} />
  }

}


function useGameSocket(setConnected) {
  const ws = useRef<WebSocket>(null)
  // new WebSocket('/socket')
  useEffect(
    () => {
      function connect(attempt: number) {
        ws.current = new WebSocket("/game")
        ws.current.onopen = () => {
          console.log("Joined Game!")
          setConnected(true)
        }


        ws.current.onclose = (ev) => {
          console.log(ev.code)
          if (ev.code !== 1000) {
            setTimeout(() => connect(attempt + 1), Math.min(2000 ** attempt, 30000))
            return
          }
          setConnected(false)
          console.log(`Closed Socket on attempt ${attempt}`)
        }
      }

      connect(0)

      // ws.current.send(serializeMessage({
      //   kind: MessageKind.CONNECT,
      // }))

      return () => ws.current.close(1000)
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

// function
