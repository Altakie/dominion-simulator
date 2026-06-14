import { type JSX } from 'react'
import './App.css'
import type { GameState, Player } from "shared";
import type { Supply } from "shared/supply";
import type { Card } from "shared/cards"

export function Game({ player_names: players, player, game_state, choices }: { player_names: string[], player: Player, game_state: GameState, choices?: JSX.Element }) {
  if (!choices) {
    choices = <></>
  } else {
    console.log("Rendering choices")
  }
  return <>
    <h1>Game</h1>
    <PlayerList players={players} />
    <VisualGameState players={players} game_state={game_state} />
    <Hand hand={player.hand} />
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
      <p>Phase : {game_state.phase}</p>
      <p>Played Cards: {game_state.played_cards.map((card) => card.info.name).toString()}</p>
      <p>Trash Pile: {game_state.trash_pile.map((card) => card.info.name)}</p>
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

function Hand({ hand }: { hand: Card[] }) {
  return (<>
    <h2>Current Hand</h2>
    <p>{hand.map((card) => card.info.name).toString()}</p>
  </>)
}

// TODO: Implement proper card visuals
function CardDisplay({ card }: { card: Card }) {
}

function Log() {
}

