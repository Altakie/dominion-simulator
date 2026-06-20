import type { Dispatch, SetStateAction } from "react";
import type { PlayerEndInfo } from "shared";
import type { GameEndMessage } from "shared/messages";
import { LobbyState } from "./Lobby";
import { Button } from "./App";
import type { Card, CardName } from "shared/cards";
import { type supplyStack } from "shared/supply";

export function GameEnd({ setLobbyState, game_end_message }: { setLobbyState: Dispatch<SetStateAction<typeof LobbyState[keyof typeof LobbyState]>>, game_end_message: GameEndMessage }) {
  // const victory_message = game_end_message.player_end_infos_in_victory_order[0].name 

  return (
    <>
      <h1>Game End</h1>
      {game_end_message.players_end_infos_in_victory_order.map((player_end_info) => <PlayerStats player_end_info={player_end_info} />)}
      <Button onClick={() => {
        setLobbyState(LobbyState.LOBBY)
      }}>Back to Lobby</Button>
    </>
  )
}

function PlayerStats({ player_end_info }: { player_end_info: PlayerEndInfo }) {
  return (<>
    <div className="border">
      <h2>{player_end_info.name} : {player_end_info.victory_points}vp</h2>
      <FinalDeckDisplay deck={player_end_info.final_deck} />
    </div>
  </>)
}

function FinalDeckDisplay({ deck }: { deck: Card[] }) {
  const stacks: Map<CardName, number> = new Map()
  for (const card of deck) {
    const prev = stacks.get(card.info.name)
    stacks.set(card.info.name, prev == undefined ? 1 : prev + 1)
  }

  return (<>
    {Array.from(stacks.entries()).map(([name, count]) => {
      return (<div>
        {name} : {count}
      </div>)
    })}
  </>)

}

function VpDisplay() {

}
