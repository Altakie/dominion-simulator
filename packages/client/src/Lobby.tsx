import { serializeMessage, MessageKinds, parseMessage, type ConnectMessage, type DisconnectMessage, type PlayerNamesMessage, type StartedMessage, type PickCardsResponse, type PickSupplyPileRequest, type PickSupplyPileResponse, type PickCardsRequest, type GameStateUpdateMessage } from "shared/messages"
import { useEffect, useState, useRef, useContext, type JSX } from 'react'
import { StateContext } from "./App";
import './App.css'
import { Game } from "./Game.tsx"
import type { GameState, Player } from "shared";
import type { Card } from "shared/cards.ts";
import type { supplyStack } from "shared/supply.ts";

export function Lobby() {
  const [connected, setConnected] = useState(false)
  const gameSocket = useGameSocket(setConnected);
  const { setState } = useContext(StateContext)

  // TODO: combine these two to avoid data duplication
  const [player_names, setPlayerNames] = useState<Set<string>>(new Set())
  const [player_names_in_order, setPlayerNamesInOrder] = useState<string[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [choice_list, setChoiceList] = useState<JSX.Element>(null)

  const [gameState, setGameState] = useState<GameState>(null)
  const [player, setPlayer] = useState<Player>(null)


  const resolve_message =
    (ev: MessageEvent) => {
      console.log(`Message: ${ev.data}`)
      const message = parseMessage(ev.data)
      if (!message) {
        return
      }

      switch (message.kind) {
        case MessageKinds.PLAYER_NAMES:
          const player_msg = message as PlayerNamesMessage
          setPlayerNames(new Set(player_msg.player_names))
          console.log(JSON.stringify([...player_names]))
          break
        case MessageKinds.CONNECT:
          const conn_msg = message as ConnectMessage
          setPlayerNames(prev => {
            prev.add(conn_msg.player_name)
            return new Set(prev)
          })
          break
        case MessageKinds.DISCONNECT:
          const disconn_msg = message as DisconnectMessage
          setPlayerNames(prev => {
            prev.delete(disconn_msg.player_name)
            return new Set(prev)
          })
          break
        case MessageKinds.STARTED:
          const started_msg = message as StartedMessage
          setPlayerNamesInOrder(started_msg.player_name_order)
          setGameState(started_msg.state)
          setGameStarted(true)
          setPlayer(started_msg.player)
          break
        case MessageKinds.PICK_CARDS_REQUEST:
          setChoiceList(
            <ChooseCardsList message={message as PickCardsRequest} game_socket={gameSocket.current} setChoiceList={setChoiceList} />
          )
          break
        case MessageKinds.PICK_SUPPLY_PILE_REQUEST:
          console.log("Setting Choice")
          setChoiceList(
            <ChooseSupplyPilesList message={message as PickSupplyPileRequest} game_socket={gameSocket.current} setChoiceList={setChoiceList} />
          )
          break
        // case MessageKinds.PICK_YES_NO_REQUEST:
        //   break
        case MessageKinds.GAME_STATE_UPDATE:
          const update_message: GameStateUpdateMessage = message as GameStateUpdateMessage
          setGameState(update_message.game_state)
          setPlayer(update_message.player)
          break
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
          disabled={!connected}
        >Start Game</button>

        <PlayerList players={player_names} />

        <button onClick={() => {
          setState("Home")
          gameSocket.current.close(1000)
        }}>Leave Game</button>
      </>
    )
  } else {
    return <Game player_names={player_names_in_order} game_state={gameState} choices={choice_list} player={player} />
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

function ChooseCardsList({ message, game_socket, setChoiceList }: { message: PickCardsRequest, game_socket: WebSocket, setChoiceList }) {
  const [choices, setChoices] = useState<Card[]>([])

  function CardChoiceButton({ card }: { card: Card }) {
    const selected = choices.includes(card)

    return (
      <button style={(() => {
        if (selected) {
          return {
            color: "red"
          }
        }
        else {
          return {}
        }
      })()}
        onClick={() => {
          if (!choices.includes(card)) {
            setChoices([...choices, card])
            return
          }

          setChoices(choices.filter((c) => (c !== card)))
        }}

      >{card.info.name}</button>
    )
  }

  return (
    <>
      <h3>{message.description}</h3>
      <h3>Currently Selected</h3>
      {choices.map((card) =>
        <p>{card.info.name}</p>
      )}

      <h3>Choices</h3>
      {
        message.choices.map((card) => (<CardChoiceButton card={card} />))
      }

      <button
        onClick={
          () => {
            let res: PickCardsResponse = {
              kind: MessageKinds.PICK_CARDS_RESPONSE,
              choices: choices
            }
            setChoices([])
            setChoiceList(null)
            game_socket.send(JSON.stringify(res))
          }
        }

        disabled={
          choices.length > message.max || choices.length < message.min
        }>Confirm Choices</button >
    </>
  )
}

function ChooseSupplyPilesList({ message, game_socket, setChoiceList }: { message: PickSupplyPileRequest, game_socket: WebSocket, setChoiceList }) {
  const [choices, setChoices] = useState<supplyStack[]>([])

  function SupplyPileButton({ supply_pile }: { supply_pile: supplyStack }) {
    const selected = choices.includes(supply_pile)

    return (
      <button style={selected ?
        { color: "red" } : {}
      }
        onClick={() => {
          if (!choices.includes(supply_pile)) {
            setChoices([...choices, supply_pile])
            return
          }

          setChoices(choices.filter((ss) => (ss !== supply_pile)))
        }}

      >{supply_pile.card.name} : ${supply_pile.card.cost}</button>
    )
  }


  return (
    <>
      <h3>{message.description}</h3>
      <h3>Currently Selected</h3>
      {choices.map((supply_pile) =>
        <p>{supply_pile.card.name}</p>
      )}

      <h3>Choices</h3>
      {
        message.choices.map((supply_pile) => (<SupplyPileButton supply_pile={supply_pile} />))
      }

      <button
        onClick={
          () => {
            let res: PickSupplyPileResponse = {
              kind: MessageKinds.PICK_SUPPLY_PILE_RESPONSE,
              choices: choices
            }
            setChoices([])
            setChoiceList(null)
            game_socket.send(JSON.stringify(res))
          }
        }

        disabled={
          choices.length > message.max || choices.length < message.min
        }>Confirm Choices</button >
    </>
  )
}

// TODO: Implement Pick Yes No Response

