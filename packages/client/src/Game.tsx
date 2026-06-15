import { type JSX } from 'react'
import './App.css'
import type { GameState, Player } from "shared";
import type { Supply, supplyStack } from "shared/supply";
import type { Card } from "shared/cards"

export function Game({ player_names: players, player, game_state, choices }: { player_names: string[], player: Player, game_state: GameState, choices?: JSX.Element }) {
  if (!choices) {
    choices = <></>
  } else {
    console.log("Rendering choices")
  }
  return <>
    <h1>Game</h1>
    <div className='flex flex-row flex-nowrap justify-center items-start place-content-between'>
      <div className='flex-col w-1/5 border'>
        <PlayerList players={players} />
        <h2>Current Vp: <span>{player.victory_points}</span></h2>
        <VisualGameState players={players} game_state={game_state} />
      </div>
      <div className='flex-col w-3/5 border'>
        <VisualSupply supply={game_state.supply} />
        <PlayedCards played_cards={game_state.played_cards} />
        <Hand hand={player.hand} />
        {choices}
      </div>
      <div className='flex-col w-1/5 border'>
      </div>
    </div>
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
      <p>Trash Pile: {game_state.trash_pile.map((card) => card.info.name)}</p>
    </div>
  </>
}

function PlayedCards({ played_cards }: { played_cards: Card[] }) {
  return (
    <>
      <h2>Played Cards</h2>
      <div className='flex flex-row flex-wrap justify-center items-center'>
        {played_cards.map((card) => <CardDisplay card={card} />)}
      </div>
    </>
  )
}

function TurnInfo({ game_state }: { game_state: GameState }) {
  return (<>
    <div>
      <h2>Turn Info</h2>
      <p>Turn Number: {game_state.turn_number}</p>
      <p>Actions: {game_state.actions}</p>
      <p>Money: {game_state.money}</p>
      <p>Buys: {game_state.buys}</p>
    </div>
  </>
  )
}

function VisualSupply({ supply }: { supply: Supply }) {
  return <>
    <h2>Supply</h2>
    <div className='flex flex-row flex-wrap p-4 items-end'>
      {supply.stacks.map((supply_stack) => <VisualSupplyStack supply_stack={supply_stack} />)}
    </div>
  </>
}

function VisualSupplyStack({ supply_stack }: { supply_stack: supplyStack }) {
  return (
    <div className='border w-1/5 h-auto p-px'>
      <p className='text-black'>{supply_stack.card.name}</p>
      <div className='flex flex-row justify-between'>
        <GoldCoin cost={supply_stack.card.cost} />
        <div className='bg-red-800 text-white rounded-sm w-6 h-6'>{supply_stack.count}</div>
      </div>
    </div>)
}


function Hand({ hand }: { hand: Card[] }) {
  return (<>
    <h2>Current Hand</h2>
    <div className='flex flex-row flex-wrap items-center justify-center'>
      {hand.map((card) => <CardDisplay card={card} />)}
    </div>
  </>)
}

// TODO: Implement proper card visuals
function CardDisplay({ card }: { card: Card }) {
  return (
    <div className='border w-1/5 h-auto p-px'>
      <p className='text-black'>{card.info.name}</p>
      <div className='flex flex-row justify-start'>
        <GoldCoin cost={card.info.cost} />
      </div>
    </div>)
}

function Log() {
}


function GoldCoin({ cost }: { cost: number }) {
  return <div className='bg-yellow-300 text-black rounded-full w-6 h-6 flex items-center justify-center'>{cost}</div>
}
