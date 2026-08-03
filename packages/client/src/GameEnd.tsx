import type { PlayerEndInfo } from "shared";
import type { Card, CardName } from "shared/cards";
import type { GameEndMessage } from "shared/messages";
import { useShallow } from "zustand/shallow";
import { Button } from "./components/ui/button.tsx";
import {
  CardContent,
  CardTitle,
  Card as UiCard,
} from "./components/ui/card.tsx";
import { Separator } from "./components/ui/separator.tsx";
import { LobbyStates, useLobbyStore } from "./Lobby";

export function GameEnd() {
  // const victory_message = game_end_message.player_end_infos_in_victory_order[0].name
  const set_lobby_state = useLobbyStore((state) => state.set_lobby_state);
  const [message, player_game_infos] = useLobbyStore(
    useShallow((state) => [state.message, state.player_game_infos]),
  );
  const game_end_message = message as GameEndMessage;

  let title = "Game Over";
  if (game_end_message.winner_indices.length === 1) {
    title = `${player_game_infos[game_end_message.winner_indices[0]]?.name} wins!`;
  } else if (game_end_message.winner_indices.length > 1) {
    title = `${game_end_message.winner_indices.map((idx) => player_game_infos[idx]?.name).join(" and ")} tie!`;
  }

  return (
    <div className="overflow-auto flex flex-col items-center">
      <div className="flex gap-2 flex-row flex-nowrap items-center my-2">
        <div className="flex-1">
          <Separator />
        </div>
        <div>
          <p className="text-foreground text-xl">
            <b>{title}</b>
          </p>
        </div>
        <div className="flex-1">
          <Separator />
        </div>
      </div>
      <div className="flex flex-col flex-nowrap gap-2">
        {game_end_message.players_end_infos_in_victory_order.map(
          // WARN: Key is not unique here, can maybe use clientid?
          (player_end_info) => (
            <PlayerStats
              key={player_end_info.name}
              player_end_info={player_end_info}
            />
          ),
        )}
      </div>
      <Button
        onClick={() => {
          set_lobby_state(LobbyStates.LOBBY);
        }}
      >
        Back to Lobby
      </Button>
    </div>
  );
}

function PlayerStats({ player_end_info }: { player_end_info: PlayerEndInfo }) {
  return (
    <UiCard className="w-80">
      <CardTitle>
        <p className="text-lg">
          <b>
            {player_end_info.name} : {player_end_info.victory_points}
          </b>
        </p>
      </CardTitle>
      <CardContent className="flex flex-col items-center gap-2">
        <Separator />
        <FinalDeckDisplay deck={player_end_info.final_deck} />
      </CardContent>
    </UiCard>
  );
}

function FinalDeckDisplay({ deck }: { deck: Card[] }) {
  const stacks: Map<CardName, number> = new Map();
  for (const card of deck) {
    const prev = stacks.get(card.info.name);
    stacks.set(card.info.name, prev === undefined ? 1 : prev + 1);
  }

  return (
    <div className="flex flex-col flex-nowrap gap-1 w-7/10">
      {Array.from(stacks.entries()).map(([card_name, count]) => {
        return (
          <div key={card_name} className="text-sm border-l-2 border-gray-400">
            {card_name} : {count}
          </div>
        );
      })}
    </div>
  );
}
