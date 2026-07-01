import { type JSX, useEffect, useState } from "react";
import {
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
import type { GameState, Player } from "shared";
import type { Card } from "shared/cards.ts";
import { create } from "zustand";
import { useShallow } from "zustand/shallow";
import { Game } from "./Game.tsx";
import { GameEnd } from "./GameEnd.tsx";

// export const GameContext = createContext<{
//   gameSocket: RefObject<WebSocket>,
//   gameState: GameState,
//   message?: Message,
//   player: Player
// }>(null)
//

export let game_socket: WebSocket = null;

export const LobbyStates = {
  LOBBY: "Lobby",
  GAME_STARTED: "Game Started",
  GAME_END: "Game End",
};

type LobbyStore = {
  connected: boolean;
  set_connected: (connected: boolean) => void;
  player_names: string[];
  add_player_name: (name: string) => void;
  remove_player_name: (name: string) => void;
  set_player_names: (names: string[]) => void;
  lobby_state: (typeof LobbyStates)[keyof typeof LobbyStates];
  set_lobby_state: (
    game_started: (typeof LobbyStates)[keyof typeof LobbyStates],
  ) => void;
  choice_list?: JSX.Element;
  set_choice_list: (choice_list?: JSX.Element) => void;

  game_state?: GameState;
  set_game_state: (game_state: GameState) => void;
  message?: Message;
  set_message: (message?: Message) => void;
  player?: Player;
  set_player: (player?: Player) => void;
  log_messages: string[];
  add_log_message: (message: string) => void;
  clear_log: () => void;
};

export const useLobbyStore = create<LobbyStore>((set) => ({
  connected: false,
  set_connected: (connected: boolean) => {
    set(() => ({ connected: connected }));
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
    set(() => ({ player_names: names }));
  },
  lobby_state: LobbyStates.LOBBY,
  set_lobby_state: (game_started) => {
    set(() => ({ lobby_state: game_started }));
  },
  set_choice_list: (choice_list) => {
    set(() => ({ choice_list: choice_list }));
  },

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
  add_log_message: (message: string) => {
    set((state) => ({ log_messages: [...state.log_messages, message] }));
  },
  clear_log: () => {
    set(() => ({ log_messages: [] }));
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
      set_choice_list: state.set_choice_list,

      set_game_state: state.set_game_state,
      set_message: state.set_message,
      set_player: state.set_player,
      add_log_message: state.add_log_message,
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
        const conn_msg = message as ConnectMessage;
        lobby_store.add_player_name(conn_msg.player_name);
        break;
      }
      case MessageKinds.DISCONNECT: {
        const disconn_msg = message as DisconnectMessage;
        lobby_store.remove_player_name(disconn_msg.player_name);
        break;
      }
      case MessageKinds.STARTED: {
        const started_msg = message as StartedMessage;
        lobby_store.set_player_names(started_msg.player_name_order);
        lobby_store.set_game_state(started_msg.state);
        lobby_store.set_lobby_state(LobbyStates.GAME_STARTED);
        lobby_store.set_player(started_msg.player);
        break;
      }
      case MessageKinds.PICK_CARDS_REQUEST:
        // NOTE: Handled elsewhere
        lobby_store.set_choice_list(
          <ChooseCardsList message={message as PickCardsRequest} />,
        );
        lobby_store.set_message(message);
        break;
      case MessageKinds.PICK_SUPPLY_PILE_REQUEST:
        // lobby_store.set_choice_list(
        //   <ChooseSupplyPilesList message={message as PickSupplyPileRequest} game_socket={gameSocket.current} lobby_store.set_choice_list={setChoiceList} />
        // )
        lobby_store.set_message(message);
        break;
      case MessageKinds.PICK_YES_NO_REQUEST:
        lobby_store.set_choice_list(
          <ChooseYesNo message={message as PickYesNoRequest} />,
        );
        lobby_store.set_message(message);
        break;
      case MessageKinds.GAME_STATE_UPDATE: {
        const update_message: GameStateUpdateMessage =
          message as GameStateUpdateMessage;
        lobby_store.set_game_state(update_message.game_state);
        lobby_store.set_player(update_message.player);
        break;
      }
      case MessageKinds.GAME_END:
        lobby_store.set_message(message);
        lobby_store.set_lobby_state(LobbyStates.GAME_END);
        lobby_store.clear_log();
        break;
      case MessageKinds.LOG: {
        const log_message = message as LogMessage;
        lobby_store.add_log_message(log_message.log_message);
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
      return (
        <>
          <h1>Welcome to the game</h1>
          <Button
            onClick={() => {
              console.log("Attempting to start game");
              game_socket.send(
                serializeMessage({
                  kind: MessageKinds.START,
                }),
              );
            }}
            disabled={!lobby_store.connected}
          >
            Start Game
          </Button>

          <PlayerList />

          <Button
            onClick={() => {
              game_socket.close(1000);
              // WARN: Set in two places, probably fine but check again later
              set_router_state(RouterStates.HOME);
            }}
          >
            Leave Game
          </Button>
        </>
      );
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
      game_socket.close(1000);
    };
  }, [set_connected, set_router_state, set_lobby_state]);
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
  // WARN: Player names are not unique and may not be useable as a key
  return (
    <>
      <h2>Players:</h2>
      {players.map((name) => (
        <PlayerNameDisplay key={name} name={name} />
      ))}
    </>
  );
}

export function PlayerNameDisplay({ name }: { name: string }) {
  return (
    <div className="border mx-auto w-[10vw] h-lh text-ellipsis text-nowrap overflow-auto">
      {name}
    </div>
  );
}

function ChooseCardsList({ message }: { message: PickCardsRequest }) {
  const set_choice_list = useLobbyStore((state) => state.set_choice_list);
  const [choices, setChoices] = useState<Card[]>([]);

  function CardChoiceButton({ card }: { card: Card }) {
    const selected = choices.includes(card);

    return (
      <Button
        style={(() => {
          if (selected) {
            return {
              color: "red",
            };
          } else {
            return {};
          }
        })()}
        onClick={() => {
          if (!choices.includes(card)) {
            setChoices([...choices, card]);
            return;
          }

          setChoices(choices.filter((c) => c !== card));
        }}
      >
        {card.info.name}
      </Button>
    );
  }

  return (
    <>
      <h3>{message.description}</h3>
      <h3>Currently Selected</h3>
      {choices.map((card) => (
        <p key={card.id}>{card.info.name}</p>
      ))}

      <h3>Choices</h3>
      {message.choices.map((card) => (
        <CardChoiceButton key={card.id} card={card} />
      ))}

      <Button
        onClick={() => {
          const res: PickCardsResponse = {
            kind: MessageKinds.PICK_CARDS_RESPONSE,
            choices: choices,
          };
          setChoices([]);
          set_choice_list(undefined);
          game_socket.send(JSON.stringify(res));
        }}
        disabled={choices.length > message.max || choices.length < message.min}
      >
        Confirm Choices
      </Button>
    </>
  );
}

// function ChooseSupplyPilesList({ message, game_socket, lobby_store.set_choice_list }: { message: PickSupplyPileRequest, game_socket: WebSocket, setChoiceList }) {
//   const [choices, setChoices] = useState<supplyStack[]>([])
//
//   function SupplyPileButton({ supply_pile }: { supply_pile: supplyStack }) {
//     const selected = choices.includes(supply_pile)
//
//     return (
//       <Button style={selected ?
//         { color: "red" } : {}
//       }
//         onClick={() => {
//           if (!choices.includes(supply_pile)) {
//             setChoices([...choices, supply_pile])
//             return
//           }
//
//           setChoices(choices.filter((ss) => (ss !== supply_pile)))
//         }}
//
//       >{supply_pile.card.name} : ${supply_pile.card.cost}</Button>
//     )
//   }
//
//
//   return (
//     <>
//       <h3>{message.description}</h3>
//       <h3>Currently Selected</h3>
//       {choices.map((supply_pile) =>
//         <p>{supply_pile.card.name}</p>
//       )}
//
//       <div>
//         <h3>Choices</h3>
//         {
//           message.choices.map((supply_pile) => (<SupplyPileButton supply_pile={supply_pile} />))
//         }
//       </div>
//
//       <div>
//         <Button
//           onClick={
//             () => {
//               let res: PickSupplyPileResponse = {
//                 kind: MessageKinds.PICK_SUPPLY_PILE_RESPONSE,
//                 choices: choices
//               }
//               setChoices([])
//               lobby_store.set_choice_list(null)
//               game_socket.send(JSON.stringify(res))
//             }
//           }
//
//           disabled={
//             choices.length > message.max || choices.length < message.min
//           }>Confirm Choices</Button >
//       </div>
//     </>
//   )
// }

function ChooseYesNo({ message }: { message: PickYesNoRequest }) {
  const set_choice_list = useLobbyStore((state) => state.set_choice_list);

  function send_choice(choice: boolean) {
    const res: PickYesNoResponse = {
      kind: MessageKinds.PICK_YES_NO_RESPONSE,
      choice: choice,
    };
    set_choice_list(undefined);
    game_socket.send(JSON.stringify(res));
  }

  return (
    <>
      <h3>Card: {message.card.info.name}</h3>
      <h3>Choices</h3>
      <p>
        <Button
          onClick={() => {
            send_choice(true);
          }}
        >
          Yes
        </Button>

        <Button
          onClick={() => {
            send_choice(false);
          }}
        >
          No
        </Button>
      </p>
    </>
  );
}
