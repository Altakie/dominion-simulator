import { serializeMessage, MessageKinds, parseMessage, type ConnectMessage, type DisconnectMessage, type PlayerNamesMessage } from "shared/messages"
import { useEffect, useState, useRef, useContext, type JSX } from 'react'
import { StateContext } from "./App";
import './App.css'
import type { GameState } from "shared";
import type { Supply } from "shared/supply";

export function Game({ players, game_state, choices }: { players: string[], game_state: GameState, choices?: JSX.Element }) {
  if (!choices) {
    choices = <></>
  } else {
    console.log("Rendering choices")
  }
  return <>
    <h1>Game</h1>
    <PlayerList players={players} />
    <VisualGameState players={players} game_state={game_state} />
    {choices}
  </>
}

function PlayerList({ players }: { players: string[] }) {
  return <>
    <h2>Players</h2>
    <ol>
      {players.map((name) => <li>{name}</li>)}
    </ol>
  </>
}

function VisualGameState({ players, game_state }: { players: string[], game_state: GameState }) {
  return <>
    <div>
      <h2>GameState Info</h2>
      <p>Current Player: {players[game_state.current_player_index]}</p>
    </div>
    <div>
      <h2>Turn Info</h2>
      <p>Turn Number: {game_state.turn_number}</p>
      <p>Actions: {game_state.actions}</p>
      <p>Money: {game_state.money}</p>
      <p>Buys: {game_state.buys}</p>
    </div>
    <VisualSupply supply={game_state.supply} />
  </>
}

function VisualSupply({ supply }: { supply: Supply }) {
  return <>
    <h2>Supply</h2>
    {supply.stacks.map((supply_stack) => {
      return <p>{supply_stack.card.name}: {supply_stack.count}</p>
    })}
  </>
}

function Hand() {
}

function Card() {
}

function Log() {
}

