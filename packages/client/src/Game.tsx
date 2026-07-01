import {
  type Dispatch,
  type ReactNode,
  type Ref,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import "./App.css";
import { type Card, type CardInfo, CardTypes } from "shared/cards";
import {
  MessageKinds,
  type PickCardsRequest,
  type PickCardsResponse,
  type PickSupplyPileRequest,
  type PickSupplyPileResponse,
  type PickYesNoRequest,
  type PickYesNoResponse,
  type RequestMessage,
  request_message_kinds,
} from "shared/messages";
import type { Supply, supplyStack } from "shared/supply";
import { Button } from "./components/ui/button.tsx";
import { Dialog, DialogClose, DialogContent } from "./components/ui/dialog.tsx";
import { game_socket, PlayerNameDisplay, useLobbyStore } from "./Lobby";

export function Game() {
  // let choices = useLobbyStore((state) => state.choice_list);
  const player = useLobbyStore((state) => state.player)!;
  const game_state = useLobbyStore((state) => state.game_state)!;
  const message = useLobbyStore((state) => state.message)!;

  let pop_up = <></>;
  switch (message?.kind) {
    case MessageKinds.PICK_YES_NO_REQUEST:
      pop_up = <ChooseYesNo />;
      break;
    case MessageKinds.PICK_CARDS_REQUEST: {
      const pick_cards_req = message as PickCardsRequest;
      const cards_not_in_hand = pick_cards_req.choices.filter(
        (card) => !player.hand.some((c) => c.id === card.id),
      );
      if (cards_not_in_hand.length > 0) {
        pop_up = <ChooseCardsList extra_cards={cards_not_in_hand} />;
      }
      break;
    }
  }

  return (
    <>
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
          {/* {choices} */}
          {pop_up}
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
      {/* <ol> */}
      {/*   {players.map((name) => ( */}
      {/*     <li>{name}</li> */}
      {/*   ))} */}
      {/* </ol> */}
      {players.map((name) => (
        <PlayerNameDisplay key={name} name={name} />
      ))}
    </>
  );
}

function VisualGameState() {
  const players = useLobbyStore((state) => state.player_names);
  const game_state = useLobbyStore((state) => state.game_state)!;

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
  const scroll_ref: Ref<HTMLDivElement> = useRef(null);
  useEffect(() => {
    if (scroll_ref.current !== null) {
      scroll_ref.current.scrollTop = scroll_ref.current.scrollHeight;
    }
  });

  return (
    <>
      <h2>Played Cards</h2>
      <div
        className="flex flex-row flex-wrap overflow-auto gap-4 justify-center items-center h-22"
        ref={scroll_ref}
      >
        {played_cards.map((card) => (
          <CardDisplay key={card.id} card={card} />
        ))}
      </div>
    </>
  );
}

function TurnInfo() {
  const game_state = useLobbyStore((state) => state.game_state)!;
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
            setMessage(undefined);
            game_socket?.send(JSON.stringify(res));
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
      <div className="flex flex-row flex-wrap p-4 gap-4 justify-center items-center">
        {supply.fixed_stacks.map((supply_stack) => {
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
                key={supply_stack.card.name}
                supply_stack={supply_stack}
                selected_stacks={selected_stacks}
                setSelectedStacks={setSelectedStacks}
              />
            );
          }
          return (
            <VisualSupplyStack
              key={supply_stack.card.name}
              supply_stack={supply_stack}
            />
          );
        })}
      </div>
      <div className="flex flex-row flex-wrap p-4 gap-4 justify-center items-center">
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
          return (
            <VisualSupplyStack
              key={supply_stack.card.name}
              supply_stack={supply_stack}
            />
          );
        })}
      </div>
      {confirm_choices_button()}
    </>
  );
}

function VisualSupplyStack({ supply_stack }: { supply_stack: supplyStack }) {
  return (
    <CardShell card_info={supply_stack.card}>
      <div className="flex flex-row justify-between">
        <GoldCoin cost={supply_stack.card.cost} />
        <div className="bg-red-800 text-white rounded-sm w-6 h-6 flex justify-center items-center">
          {supply_stack.count}
        </div>
      </div>
    </CardShell>
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
    <CardShell
      card_info={supply_stack.card}
      className={`${selected ? "border-green-400 hover:border-green-600" : "border-red-600 hover:border-red-800"}`}
      onClick={() => {
        if (selected) {
          setSelectedStacks((prev) => prev.filter((c) => c !== supply_stack));
        } else {
          setSelectedStacks((prev) => [...prev, supply_stack]);
        }
      }}
    >
      <div className="flex flex-row justify-between">
        <GoldCoin cost={supply_stack.card.cost} />
        <div className="bg-red-800 text-white rounded-sm w-6 h-6 flex justify-center items-center">
          {supply_stack.count}
        </div>
      </div>
    </CardShell>
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
            setMessage(undefined);
            // Need to set message to null
            game_socket?.send(JSON.stringify(res));
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
      <div className="flex flex-row flex-wrap gap-4 items-center justify-center">
        {hand.map((card) => {
          if (
            pick_cards_req !== undefined &&
            pick_cards_req.choices.some((c) => c.id === card.id)
          ) {
            console.log("Rendering button");
            return (
              <CardButton
                key={card.id}
                card={card}
                selected_cards={selected_cards}
                setSelectedCards={setSelectedCards}
              />
            );
          }
          console.log("Other");
          return <CardDisplay key={card.id} card={card} />;
        })}
      </div>
      {confirm_choices_button()}
    </>
  );
}

function CardShell({
  card_info,
  children,
  className = "",
  ...props
}: {
  card_info: CardInfo;
  children: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`text-xs border-4 border-gray-400 rounded-lg w-22 h-20 p-px flex flex-col shrink-0 grow-0 justify-between text-center ${card_bg(card_info)} ${className}`}
      {...props}
    >
      <p className="text-black">{card_info.name}</p>
      {children}
    </div>
  );
}

function CardDisplay({ card }: { card: Card }) {
  return (
    <CardShell card_info={card.info}>
      <div className="flex flex-row justify-start">
        <GoldCoin cost={card.info.cost} />
      </div>
    </CardShell>
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
  return "bg-white";
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
    <CardShell
      card_info={card.info}
      className={
        selected
          ? "border-green-400 hover:border-green-600"
          : "border-red-600 hover:border-red-800"
      }
      onClick={() => {
        if (selected) {
          setSelectedCards((prev) => prev.filter((c) => c !== card));
        } else {
          setSelectedCards((prev) => [...prev, card]);
        }
      }}
    >
      <div className="flex flex-row justify-start">
        <GoldCoin cost={card.info.cost} />
      </div>
    </CardShell>
  );
}

function Log() {
  const log_messages = useLobbyStore((state) => state.log_messages);

  return (
    <div className="bg-gray-300 overflow-auto max-h-1/2">
      {log_messages.map((message) => {
        if (message.includes("Turn")) {
          return (
            <h3 key={message} className="text-black border text-wrap">
              <b>{message}</b>
            </h3>
          );
        }
        return (
          <p key={message} className="text-black border text-wrap">
            {message}
          </p>
        );
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

function ChooseCardsList({ extra_cards }: { extra_cards: Card[] }) {
  // const set_choice_list = useLobbyStore((state) => state.set_choice_list);
  const [choices, setChoices] = useState<Card[]>([]);
  const message = useLobbyStore((state) => state.message as PickCardsRequest);
  const set_message = useLobbyStore((state) => state.set_message);

  return (
    <>
      <Dialog open={true}>
        <DialogContent>
          <h2>{message.description}</h2>

          <div className="flex flex-row flex-nowrap justify-between overflow-auto">
            {extra_cards.map((card) => (
              <CardButton
                key={card.id}
                card={card}
                selected_cards={choices}
                setSelectedCards={setChoices}
              />
            ))}
          </div>

          <DialogClose>
            <Button
              onClick={() => {
                const res: PickCardsResponse = {
                  kind: MessageKinds.PICK_CARDS_RESPONSE,
                  choices: choices,
                };
                set_message(undefined);
                setChoices([]);
                game_socket?.send(JSON.stringify(res));
              }}
              disabled={
                choices.length > message.max || choices.length < message.min
              }
            >
              Confirm Choices
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ChooseYesNo() {
  // const set_choice_list = useLobbyStore((state) => state.set_choice_list);
  const message = useLobbyStore((state) => state.message as PickYesNoRequest);
  const set_message = useLobbyStore((state) => state.set_message);

  function send_choice(choice: boolean) {
    const res: PickYesNoResponse = {
      kind: MessageKinds.PICK_YES_NO_RESPONSE,
      choice: choice,
    };
    set_message(undefined);
    game_socket?.send(JSON.stringify(res));
  }

  return (
    <>
      <Dialog open={true}>
        <DialogContent>
          <div className="flex justify-center">
            <h2>{message.description}</h2>
            <CardDisplay key={message.card.id} card={message.card} />
            <DialogClose>
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
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// function PopUp({children}) {
//   <div className="bg-black z-1">
//   </div>
// }
