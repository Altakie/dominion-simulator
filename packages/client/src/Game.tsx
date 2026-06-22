import {
  type Dispatch,
  type JSX,
  type Ref,
  type RefObject,
  type SetStateAction,
  useState,
} from "react";
import "./App.css";
import type { GameState, Player } from "shared";
import { type Card, type CardInfo, CardTypes } from "shared/cards";
import {
  type Message,
  MessageKinds,
  type PickCardsRequest,
  type PickCardsResponse,
  type PickSupplyPileRequest,
  type PickSupplyPileResponse,
  type RequestMessage,
  request_message_kinds,
} from "shared/messages";
import type { Supply, supplyStack } from "shared/supply";
import { create } from "zustand";
import { Button } from "./App";
import { game_socket, useLobbyStore } from "./Lobby";

export function Game() {
  let choices = useLobbyStore((state) => state.choice_list);
  const player = useLobbyStore((state) => state.player);
  const game_state = useLobbyStore((state) => state.game_state);

  if (!choices) {
    choices = <></>;
  } else {
    console.log("Rendering choices");
  }
  return (
    <>
      <h1>Game</h1>
      <div className="flex flex-row flex-nowrap justify-center items-start place-content-between">
        <div className="flex-col w-1/5 border h-screen">
          <PlayerList />
          <h2>
            Current Vp: <span>{player.victory_points}</span>
          </h2>
          <VisualGameState />
        </div>
        <div className="flex-col w-3/5 border h-screen">
          <VisualSupply supply={game_state.supply} />
          <PlayedCards played_cards={game_state.played_cards} />
          <Hand hand={player.hand} />
          <Description />
          {choices}
        </div>
        <div className="flex-col w-1/5 border h-screen">
          <TurnInfo />
          <Log />
        </div>
      </div>
    </>
  );
}

function Description() {
  const message = useLobbyStore((state) => state.message);
  if (message && request_message_kinds.has(message.kind)) {
    const req = message as RequestMessage;

    return <h2>{req.description}</h2>;
  }
  return <></>;
}

function PlayerList() {
  const players = useLobbyStore((state) => state.player_names);
  return (
    <>
      <h2>Players</h2>
      <ol>
        {players.map((name) => (
          <li>{name}</li>
        ))}
      </ol>
    </>
  );
}

function VisualGameState() {
  const players = useLobbyStore((state) => state.player_names);
  const game_state = useLobbyStore((state) => state.game_state);

  return (
    <>
      <div>
        <h2>GameState Info</h2>
        <p>Current Player: {players[game_state.current_player_index]}</p>
        <p>Phase : {game_state.phase}</p>
        <div className="text-wrap w-full">
          <p>
            Trash Pile:{" "}
            {game_state.trash_pile.map((card) => card.info.name).join(", ")}
          </p>
        </div>
      </div>
    </>
  );
}

function PlayedCards({ played_cards }: { played_cards: Card[] }) {
  return (
    <>
      <h2>Played Cards</h2>
      <div className="flex flex-row flex-wrap justify-center items-center">
        {played_cards.map((card) => (
          <CardDisplay card={card} />
        ))}
      </div>
    </>
  );
}

function TurnInfo() {
  const game_state = useLobbyStore((state) => state.game_state);
  return (
    <>
      <div>
        <h2>Turn Info</h2>
        <p>Turn Number: {game_state.turn_number}</p>
        <p>Actions: {game_state.actions}</p>
        <p>Money: {game_state.money}</p>
        <p>Buys: {game_state.buys}</p>
      </div>
    </>
  );
}

function VisualSupply({ supply }: { supply: Supply }) {
  const message = useLobbyStore((state) => state.message);
  const setMessage = useLobbyStore((state) => state.set_message);

  const [selected_stacks, setSelectedStacks] = useState<supplyStack[]>([]);
  let pick_stacks_req: PickSupplyPileRequest;
  if (message && message.kind === MessageKinds.PICK_SUPPLY_PILE_REQUEST) {
    pick_stacks_req = message as PickSupplyPileRequest;
    console.log("Proper message");
  }

  const confirm_choices_button = () => {
    if (!pick_stacks_req) {
      return <></>;
    }
    return (
      <div>
        <Button
          onClick={() => {
            const res: PickSupplyPileResponse = {
              kind: MessageKinds.PICK_SUPPLY_PILE_RESPONSE,
              choices: selected_stacks,
            };
            setSelectedStacks([]);
            setMessage(null);
            game_socket.send(JSON.stringify(res));
          }}
          disabled={
            selected_stacks.length > pick_stacks_req.max ||
            selected_stacks.length < pick_stacks_req.min
          }
        >
          Confirm Choices
        </Button>
      </div>
    );
  };

  return (
    <>
      <h2>Supply</h2>
      <div className="flex flex-row flex-wrap p-4 items-end">
        {supply.stacks.map((supply_stack) => {
          if (
            pick_stacks_req &&
            pick_stacks_req.choices.some(
              (stack) =>
                stack.card.name === supply_stack.card.name &&
                stack.count === supply_stack.count,
            )
          ) {
            return (
              <SupplyStackButton
                supply_stack={supply_stack}
                selected_stacks={selected_stacks}
                setSelectedStacks={setSelectedStacks}
              />
            );
          }
          return <VisualSupplyStack supply_stack={supply_stack} />;
        })}
      </div>
      {confirm_choices_button()}
    </>
  );
}

function VisualSupplyStack({ supply_stack }: { supply_stack: supplyStack }) {
  return (
    <div className={`border w-1/5 h-auto p-px ${card_bg(supply_stack.card)}`}>
      <p className="text-black">{supply_stack.card.name}</p>
      <div className="flex flex-row justify-between">
        <GoldCoin cost={supply_stack.card.cost} />
        <div className="bg-red-800 text-white rounded-sm w-6 h-6">
          {supply_stack.count}
        </div>
      </div>
    </div>
  );
}

function SupplyStackButton({
  supply_stack,
  selected_stacks,
  setSelectedStacks,
}: {
  supply_stack: supplyStack;
  selected_stacks: supplyStack[];
  setSelectedStacks: Dispatch<SetStateAction<supplyStack[]>>;
}) {
  const selected = selected_stacks.includes(supply_stack);

  return (
    <div
      className={`border w-1/5 h-auto p-px  + ${selected ? "border-green-400 hover:border-green-600" : "border-red-600 hover:border-red-800"} ${card_bg(supply_stack.card)}`}
      onClick={() => {
        if (selected) {
          setSelectedStacks((prev) => prev.filter((c) => c !== supply_stack));
        } else {
          setSelectedStacks((prev) => [...prev, supply_stack]);
        }
      }}
    >
      <p className="text-black">{supply_stack.card.name}</p>
      <div className="flex flex-row justify-between">
        <GoldCoin cost={supply_stack.card.cost} />
        <div className="bg-red-800 text-white rounded-sm w-6 h-6">
          {supply_stack.count}
        </div>
      </div>
    </div>
  );
}

function Hand({ hand }: { hand: Card[] }) {
  const message = useLobbyStore((state) => state.message);
  const setMessage = useLobbyStore((state) => state.set_message);

  // TODO: If only one selection needed, maybe just send right away without confirming?
  // TODO: Stop the user from selecting too many cards
  const [selected_cards, setSelectedCards] = useState<Card[]>([]);
  let pick_cards_req: PickCardsRequest;
  if (message && message.kind === MessageKinds.PICK_CARDS_REQUEST) {
    pick_cards_req = message as PickCardsRequest;
    console.log("Proper message");
  }
  if (message) {
    console.log("Message exists");
  }

  const confirm_choices_button = () => {
    if (!pick_cards_req) {
      return <></>;
    }
    return (
      <div>
        <Button
          onClick={() => {
            const res: PickCardsResponse = {
              kind: MessageKinds.PICK_CARDS_RESPONSE,
              choices: selected_cards,
            };
            setSelectedCards([]);
            setMessage(null);
            // Need to set message to null
            game_socket.send(JSON.stringify(res));
          }}
          disabled={
            selected_cards.length > pick_cards_req.max ||
            selected_cards.length < pick_cards_req.min
          }
        >
          Confirm Choices
        </Button>
      </div>
    );
  };

  return (
    <>
      <h2>Current Hand</h2>
      <div className="flex flex-row flex-wrap items-center justify-center">
        {hand.map((card) => {
          if (
            pick_cards_req != undefined &&
            pick_cards_req.choices.some((c) => c.id === card.id)
          ) {
            console.log("Rendering button");
            return (
              <CardButton
                card={card}
                selected_cards={selected_cards}
                setSelectedCards={setSelectedCards}
              />
            );
          }
          console.log("Other");
          return <CardDisplay card={card} />;
        })}
      </div>
      {confirm_choices_button()}
    </>
  );
}

function CardDisplay({ card }: { card: Card }) {
  return (
    <div className={`border w-1/5 h-auto p-px ${card_bg(card.info)}`}>
      <p className="text-black">{card.info.name}</p>
      <div className="flex flex-row justify-start">
        <GoldCoin cost={card.info.cost} />
      </div>
    </div>
  );
}

function card_bg(card_info: CardInfo): string {
  if (card_info.types.includes(CardTypes.VICTORY)) {
    return "bg-green-500";
  }
  if (card_info.types.includes(CardTypes.TREASURE)) {
    return "bg-yellow-200";
  }
  if (card_info.types.includes(CardTypes.REACTION)) {
    return "bg-blue-400";
  }
  if (card_info.types.includes(CardTypes.CURSE)) {
    return "bg-purple-400";
  }
  if (card_info.types.includes(CardTypes.ACTION)) {
    return "bg-white";
  }
}

function CardButton({
  card,
  selected_cards,
  setSelectedCards,
}: {
  card: Card;
  selected_cards: Card[];
  setSelectedCards: Dispatch<SetStateAction<Card[]>>;
}) {
  const selected = selected_cards.includes(card);
  return (
    <div
      className={`border w-1/5 h-auto p-px  + ${selected ? "border-green-400 hover:border-green-600" : "border-red-600 hover:border-red-800"} ${card_bg(card.info)}`}
      onClick={() => {
        if (selected) {
          setSelectedCards((prev) => prev.filter((c) => c !== card));
        } else {
          setSelectedCards((prev) => [...prev, card]);
        }
      }}
    >
      <p className="text-black">{card.info.name}</p>
      <div className="flex flex-row justify-start">
        <GoldCoin cost={card.info.cost} />
      </div>
    </div>
  );
}

function Log() {
  const log_messages = useLobbyStore((state) => state.log_messages);

  return (
    <div className="bg-gray-300 overflow-auto max-h-1/2">
      {log_messages.map((message) => {
        if (message.includes("Turn")) {
          return (
            <h3 className="text-black border text-wrap">
              <b>{message}</b>
            </h3>
          );
        }
        return <p className="text-black border text-wrap">{message}</p>;
      })}
    </div>
  );
}

function GoldCoin({ cost }: { cost: number }) {
  return (
    <div className="bg-yellow-300 text-black rounded-full w-6 h-6 flex items-center justify-center">
      {cost}
    </div>
  );
}
