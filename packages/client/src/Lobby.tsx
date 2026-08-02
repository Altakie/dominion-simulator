import { type JSX, useEffect, useState } from "react";
import {
  type AddAIPlayerMessage,
  type ConnectMessage,
  type DisconnectMessage,
  type GameStateUpdateMessage,
  type LogMessage,
  type Message,
  MessageKinds,
  type PickCardsRequest,
  type PickCardsResponse,
  type PickYesNoRequest,
  type PickYesNoResponse,
  type PlayerNamesMessage,
  parseMessage,
  type StartedMessage,
  serializeMessage,
} from "shared/messages";
import { RouterStates, useRouterStore } from "./App";
import { Button } from "./components/ui/button.tsx";
import "./App.css";
import type {
  GameState,
  Player,
  PlayerDisplayInfo,
  SharablePlayer,
} from "shared";
import type { Card } from "shared/cards.ts";
import type { supplyStack } from "shared/supply.ts";
import { create } from "zustand";
import { useShallow } from "zustand/shallow";
import { Separator } from "./components/ui/separator.tsx";
import { Game } from "./Game.tsx";
import { GameEnd } from "./GameEnd.tsx";
import { cn } from "./lib/utils.ts";

// export const GameContext = createContext<{
//   gameSocket: RefObject<WebSocket>,
//   gameState: GameState,
//   message?: Message,
//   player: Player
// }>(null)
//

export let game_socket: WebSocket | null = null;

export const LobbyStates = Object.freeze({
  LOBBY: "Lobby",
  GAME_STARTED: "Game Started",
  GAME_END: "Game End",
});

type LobbyStore = {
  connected: boolean;
  set_connected: (connected: boolean) => void;
  player_names: string[];
  add_player_name: (name: string) => void;
  remove_player_name: (name: string) => void;
  set_player_names: (names: string[]) => void;

  player_game_infos: PlayerDisplayInfo[];
  set_player_game_infos: (infos: PlayerDisplayInfo[]) => void;

  lobby_state: (typeof LobbyStates)[keyof typeof LobbyStates];
  set_lobby_state: (
    game_started: (typeof LobbyStates)[keyof typeof LobbyStates],
  ) => void;

  game_state?: GameState;
  set_game_state: (game_state: GameState) => void;
  message?: Message;
  set_message: (message?: Message) => void;
  player?: SharablePlayer;
  set_player: (player?: SharablePlayer) => void;
  log_messages: string[];
  add_log_messages: (...messages: string[]) => void;
  clear_log: () => void;

  selected_stacks: supplyStack[];
  toggle_stack: (stack: supplyStack) => void;
  reset_stacks: () => void;

  selected_cards: Card[];
  toggle_card: (card: Card) => void;
  reset_cards: () => void;
};

export const useLobbyStore = create<LobbyStore>((set) => ({
  connected: false,
  set_connected: (connected: boolean) => {
    set({ connected: connected });
  },
  player_names: [],
  add_player_name: (name) => {
    set((state) => ({ player_names: [...state.player_names, name] }));
  },
  remove_player_name: (name) => {
    set((state) => ({
      player_names: state.player_names.filter((n) => n !== name),
    }));
  },
  set_player_names: (names) => {
    set({ player_names: names });
  },
  player_game_infos: [],
  set_player_game_infos: (infos) => {
    set({ player_game_infos: infos });
  },
  lobby_state: LobbyStates.LOBBY,
  set_lobby_state: (game_started) => {
    set({ lobby_state: game_started });
  },
  // set_choice_list: (choice_list) => {
  //   set(() => ({ choice_list: choice_list }));
  // },

  set_game_state: (game_state) => {
    set(() => ({ game_state: game_state }));
  },
  set_message: (message) => {
    set(() => ({ message: message }));
  },
  set_player: (player) => {
    set(() => ({ player: player }));
  },
  log_messages: [],
  add_log_messages: (...messages: string[]) => {
    set((state) => ({ log_messages: [...state.log_messages, ...messages] }));
  },
  clear_log: () => {
    set({ log_messages: [] });
  },

  selected_stacks: [],
  toggle_stack: (stack: supplyStack) => {
    set((state) => ({
      selected_stacks: state.selected_stacks.includes(stack)
        ? state.selected_stacks.filter((s) => s !== stack)
        : [...state.selected_stacks, stack],
    }));
  },
  reset_stacks: () => {
    set({ selected_stacks: [] });
  },

  selected_cards: [],
  toggle_card: (card: Card) => {
    set((state) => ({
      selected_cards: state.selected_cards.includes(card)
        ? state.selected_cards.filter((c) => c !== card)
        : [...state.selected_cards, card],
    }));
  },
  reset_cards: () => {
    set({ selected_cards: [] });
  },
}));

export function Lobby() {
  // const [connected, setConnected] = useState(false)
  // const gameSocket = useGameSocket(setConnected);
  useGameSocket();
  //
  const set_router_state = useRouterStore((state) => state.set_router_state);
  //
  // const [player_names, setPlayerNames] = useState<string[]>([])
  // const [gameStarted, setGameStarted] = useState<typeof LobbyState[keyof typeof LobbyState]>(LobbyState.LOBBY)
  // const [choice_list, setChoiceList] = useState<JSX.Element>(null)
  //
  // const [gameState, setGameState] = useState<GameState>(null)
  // const [message, setMessage] = useState<Message>(null);
  // const [player, setPlayer] = useState<Player>(null)
  const lobby_store = useLobbyStore(
    useShallow((state) => ({
      connected: state.connected,
      set_connected: state.set_connected,
      lobby_state: state.lobby_state,
      set_lobby_state: state.set_lobby_state,
      player_names: state.player_names,
      add_player_name: state.add_player_name,
      remove_player_name: state.remove_player_name,
      set_player_names: state.set_player_names,
      // set_choice_list: state.set_choice_list,
      set_player_game_infos: state.set_player_game_infos,

      set_game_state: state.set_game_state,
      set_message: state.set_message,
      set_player: state.set_player,
      add_log_messages: state.add_log_messages,
      clear_log: state.clear_log,
    })),
  );

  // TODO: Move this out of this function so its not recreated every render
  const resolve_message = (ev: MessageEvent) => {
    console.log(`Message: ${ev.data}`);
    const message = parseMessage(ev.data);
    if (!message) {
      return;
    }

    switch (message.kind) {
      case MessageKinds.PLAYER_NAMES: {
        const player_msg = message as PlayerNamesMessage;
        lobby_store.set_player_names(player_msg.player_names);
        console.log(JSON.stringify(lobby_store.player_names));
        break;
      }
      case MessageKinds.CONNECT: {
        // TODO: If the player is in game, it should say that a player is disconnected, vs connected, but not remove their name from the list
        if (lobby_store.lobby_state === LobbyStates.GAME_STARTED) {
          break;
        }
        const conn_msg = message as ConnectMessage;
        lobby_store.add_player_name(conn_msg.player_name);
        break;
      }
      case MessageKinds.DISCONNECT: {
        if (lobby_store.lobby_state === LobbyStates.GAME_STARTED) {
          break;
        }
        const disconn_msg = message as DisconnectMessage;
        lobby_store.remove_player_name(disconn_msg.player_name);
        break;
      }
      case MessageKinds.STARTED: {
        const started_msg = message as StartedMessage;
        lobby_store.set_player_game_infos(started_msg.players);
        lobby_store.set_game_state(started_msg.state);
        lobby_store.set_player(started_msg.player);

        lobby_store.set_lobby_state(LobbyStates.GAME_STARTED);
        break;
      }
      case MessageKinds.PICK_CARDS_REQUEST:
        // NOTE: Handled elsewhere
        // lobby_store.set_choice_list(
        //   <ChooseCardsList message={message as PickCardsRequest} />,
        // );
        lobby_store.set_message(message);
        break;
      case MessageKinds.PICK_SUPPLY_PILE_REQUEST:
        // lobby_store.set_choice_list(
        //   <ChooseSupplyPilesList message={message as PickSupplyPileRequest} game_socket={gameSocket.current} lobby_store.set_choice_list={setChoiceList} />
        // )
        lobby_store.set_message(message);
        break;
      case MessageKinds.PICK_YES_NO_REQUEST:
        // lobby_store.set_choice_list(
        //   <ChooseYesNo message={message as PickYesNoRequest} />,
        // );
        lobby_store.set_message(message);
        break;
      case MessageKinds.GAME_STATE_UPDATE: {
        const update_message: GameStateUpdateMessage =
          message as GameStateUpdateMessage;
        lobby_store.set_game_state(update_message.game_state);
        lobby_store.set_player(update_message.player);
        lobby_store.set_player_game_infos(update_message.players);
        break;
      }
      case MessageKinds.GAME_END:
        lobby_store.set_message(message);
        lobby_store.set_lobby_state(LobbyStates.GAME_END);
        lobby_store.clear_log();
        break;
      case MessageKinds.LOG: {
        const log_message = message as LogMessage;
        lobby_store.add_log_messages(...log_message.log_messages);
        break;
      }
      default:
        console.log(
          `Message kind ${message.kind} not recognized or implemented`,
        );
        break;
    }
  };

  useEffect(() => {
    if (!game_socket) {
      return;
    }
    game_socket.onmessage = resolve_message;
  });

  if (!lobby_store.connected) {
    return <Connecting />;
  }

  switch (lobby_store.lobby_state) {
    case LobbyStates.LOBBY:
      return <LobbyView />;
    case LobbyStates.GAME_STARTED:
      return (
        // <GameContext value={gameSocket}>
        /* </GameContext> */
        <Game />
      );
    case LobbyStates.GAME_END:
      return <GameEnd />;
  }
}

function useGameSocket() {
  const set_connected = useLobbyStore((state) => state.set_connected);
  const set_router_state = useRouterStore((state) => state.set_router_state);
  const set_lobby_state = useLobbyStore((state) => state.set_lobby_state);
  // new WebSocket('/socket')
  useEffect(() => {
    function connect(attempt: number) {
      game_socket = new WebSocket("/game");
      game_socket.onopen = () => {
        console.log("Joined Game!");
        set_lobby_state(LobbyStates.LOBBY);
        set_connected(true);
      };

      game_socket.onclose = (ev) => {
        set_connected(false);
        console.log(ev.code);
        if (ev.code !== 1000) {
          setTimeout(
            () => connect(attempt + 1),
            Math.min(1000 * 2 ** attempt, 30000),
          );
          return;
        }

        set_router_state(RouterStates.HOME);
        console.log(`Closed Socket on attempt ${attempt}`);
      };
    }

    connect(0);

    // ws.current.send(serializeMessage({
    //   kind: MessageKind.CONNECT,
    // }))

    return () => {
      console.log("Cleanup");
      game_socket?.close(1000);
    };
  }, [set_connected, set_router_state, set_lobby_state]);
}

function LobbyView() {
  const connected = useLobbyStore((state) => state.connected);
  const player_names = useLobbyStore((state) => state.player_names);
  const set_router_state = useRouterStore((state) => state.set_router_state);
  const set_lobby_state = useLobbyStore((state) => state.set_lobby_state);
  return (
    <>
      <div className="inline-flex justify-between p-2">
        <span className="text-black text-lg">
          <b>Welcome to the game</b>
        </span>
        <div>
          <Button
            onClick={() => {
              console.log("Attempting to start game");
              game_socket?.send(
                serializeMessage({
                  kind: MessageKinds.START,
                }),
              );
            }}
            disabled={!connected}
          >
            Start Game
          </Button>

          <Button
            onClick={() => {
              game_socket?.close(1000);
              // WARN: Set in two places, probably fine but check again later
              set_router_state(RouterStates.HOME);
            }}
          >
            Leave Game
          </Button>
        </div>
      </div>
      <Separator />
      <div className="flex flex-row h-full">
        <div className="w-3/4 p-2">Placeholder</div>
        <Separator orientation="vertical" />
        <div className="w-1/4 p-2">
          <PlayerList />
          <Button
            onClick={() => {
              const ai_player_msg: AddAIPlayerMessage = {
                kind: MessageKinds.ADD_AI_PLAYER,
              };
              game_socket?.send(serializeMessage(ai_player_msg));
            }}
            disabled={
              !connected || player_names.some((name) => name === "Gemini")
            }
          >
            Add AI Player
          </Button>
        </div>
      </div>
    </>
  );
}

function Connecting() {
  // const router_state = useRouterStore((state) => state.router_state);

  return (
    <div className="flex flex-col justify-center items-center">
      <h1>Connecting to Lobby ...</h1>
      {/* <Button onClick={() => set_router_state(RouterStates.HOME)}> */}
      {/*   Cancel */}
      {/* </Button> */}
    </div>
  );
}

function PlayerList() {
  const players = useLobbyStore((state) => state.player_names);
  return (
    <div className="text-left">
      <p className="text-md text-black">
        <b>Players</b>
      </p>
      {players.map((name) => (
        <PlayerDisplay key={name} name={name} />
      ))}
    </div>
  );
}

export function PlayerDisplay({
  name,
  under,
  right,
  highlighted = false,
}: {
  name: string;
  under?: string;
  right?: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className="border border-foreground text-black text-sm mx-auto rounded-lg text-ellipsis text-nowrap overflow-auto
      p-1 w-[15vw]
      "
    >
      <div className="flex flex-row flex-nowrap justify-left p-px items-center h-full">
        <div
          className={cn(
            "w-2 mr-2 h-10",
            highlighted ? "bg-primary rounded-md" : "",
          )}
        />

        <div className="mr-4 rounded-full bg-gray-400 border-black text-md min-w-8 min-h-8 max-h-8 max-w-8 flex items-center justify-center text-center">
          <b>{name[0]}</b>
        </div>
        <div className="flex flex-col">
          <div>
            <b>{name}</b>
          </div>
          <div className="text-xs text-gray-600">{under}</div>
        </div>
        <div className="flex-1 text-right flex flex-row justify-end items-center">
          <div className="text-black text-lg">
            <b>{right}</b>
          </div>
          <div className="text-gray-600 text-sm">{right ? "VP" : ""}</div>
        </div>
      </div>
    </div>
  );
}
