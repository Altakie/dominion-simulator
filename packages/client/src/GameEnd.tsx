import type { Dispatch, SetStateAction } from "react";
import type { PlayerEndInfo } from "shared";
import type { GameEndMessage } from "shared/messages";
import { LobbyState } from "./Lobby";
import { Button } from "./App";

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
      <p>{player_end_info.name} : {player_end_info.victory_points}vp</p>
    </div>
  </>)
}

function FinalDeckDisplay() {
}

function VpDisplay() {

}
