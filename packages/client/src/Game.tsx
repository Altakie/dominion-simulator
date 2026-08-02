import { type ReactNode, type Ref, useEffect, useRef, useState } from "react";
import "./App.css";
import { type Card, type CardInfo, CardTypes, same_card } from "shared/cards";
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
import { type Supply, same_stack, type supplyStack } from "shared/supply";
import {
  Sheet,
  SheetClose,
  SheetContent,
  // SheetDescription,
  SheetFooter,
  SheetHeader,
  // SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { card_descriptions } from "./CardDescriptions.tsx";
import { Button } from "./components/ui/button.tsx";
import { Separator } from "./components/ui/separator.tsx";
import { game_socket, PlayerNameDisplay, useLobbyStore } from "./Lobby";

function useSelection<T>(): [T[], (item: T) => void, () => void] {
  const [selected, setSelected] = useState<T[]>([]);
  const toggle = (item: T) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };
  const reset = () => setSelected([]);
  return [selected, toggle, reset];
}

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
    <div className="flex flex-row flex-nowrap justify-center items-start place-content-between">
      <div className="flex-col w-1/5 border h-screen">
        <PlayerList />
        <h2>
          Current VP: <span>{player.victory_points}</span>
        </h2>
        <div className="flex-col">
          <div>
            Deck size: <span>{player.deck_size}</span>
          </div>
          <div>
            Discard size: <span>{player.discard_pile_size}</span>
          </div>
          <div>
            Top of discard:{" "}
            <span>{player.top_of_discard_pile?.info.name ?? "None"}</span>
          </div>
        </div>
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
    <div>
      <h2>Turn Info</h2>
      <p>Turn Number: {game_state.turn_number}</p>
      <p>Actions: {game_state.actions}</p>
      <p>Money: {game_state.money}</p>
      <p>Buys: {game_state.buys}</p>
    </div>
  );
}

function VisualSupply({ supply }: { supply: Supply }) {
  const message = useLobbyStore((state) => state.message);
  const setMessage = useLobbyStore((state) => state.set_message);

  const [selected_stacks, toggle_stack, reset_stacks] =
    useSelection<supplyStack>();
  let pick_stacks_req: PickSupplyPileRequest | undefined;
  if (message && message.kind === MessageKinds.PICK_SUPPLY_PILE_REQUEST) {
    pick_stacks_req = message as PickSupplyPileRequest;
    console.log("Proper message");
  }

  const confirm_choices_button = () => {
    if (!pick_stacks_req) {
      return;
    }
    return (
      <div>
        <Button
          onClick={() => {
            const res: PickSupplyPileResponse = {
              kind: MessageKinds.PICK_SUPPLY_PILE_RESPONSE,
              choices: selected_stacks,
            };
            reset_stacks();
            setMessage(undefined);
            game_socket?.send(JSON.stringify(res));
          }}
          disabled={
            selected_stacks.length > pick_stacks_req.max ||
            selected_stacks.length < pick_stacks_req.min
          }
        >
          {selected_stacks.length > 0
            ? "Confirm Choices"
            : "Skip Remaining Gains"}
        </Button>
      </div>
    );
  };

  return (
    <>
      <h2>Supply</h2>
      <SupplyArea
        stacks={supply.fixed_stacks}
        selected_stacks={selected_stacks}
        toggle_stack={toggle_stack}
        pick_stacks_req={pick_stacks_req}
      />
      <SupplyArea
        stacks={supply.stacks}
        selected_stacks={selected_stacks}
        toggle_stack={toggle_stack}
        pick_stacks_req={pick_stacks_req}
      />
      {confirm_choices_button()}
    </>
  );
}

function SupplyArea({
  stacks,
  selected_stacks,
  toggle_stack,
  pick_stacks_req,
}: {
  stacks: supplyStack[];
  selected_stacks: supplyStack[];
  toggle_stack: (supply_stack: supplyStack) => void;
  pick_stacks_req: PickSupplyPileRequest | undefined;
}) {
  return (
    <div className="flex flex-row flex-wrap p-4 gap-4 justify-center items-center">
      {stacks.map((supply_stack) => {
        if (
          pick_stacks_req?.choices.some((stack) =>
            same_stack(stack, supply_stack),
          )
        ) {
          return (
            <SupplyStackButton
              key={supply_stack.card.name}
              supply_stack={supply_stack}
              selected={selected_stacks.includes(supply_stack)}
              onToggle={() => toggle_stack(supply_stack)}
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
  selected,
  onToggle,
}: {
  supply_stack: supplyStack;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <CardShell
      card_info={supply_stack.card}
      className={`${selected ? "border-green-400 hover:border-green-600" : "border-red-600 hover:border-red-800"}`}
      onClick={onToggle}
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
  const [selected_cards, toggle_card, reset_cards] = useSelection<Card>();
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
      return;
    }
    return (
      <div>
        <Button
          onClick={() => {
            const res: PickCardsResponse = {
              kind: MessageKinds.PICK_CARDS_RESPONSE,
              choices: selected_cards,
            };
            reset_cards();
            setMessage(undefined);
            // Need to set message to null
            game_socket?.send(JSON.stringify(res));
          }}
          disabled={
            selected_cards.length > pick_cards_req.max ||
            selected_cards.length < pick_cards_req.min
          }
        >
          {selected_cards.length > 0 ? "Confirm Choices" : "Skip"}
        </Button>
      </div>
    );
  };

  return (
    <>
      <h2>Current Hand</h2>
      <div className="flex flex-row flex-wrap gap-4 items-center justify-center">
        {hand.map((card) => {
          if (pick_cards_req?.choices.some((c) => same_card(c, card))) {
            console.log("Rendering button");
            return (
              <CardButton
                key={card.id}
                card={card}
                selected={selected_cards.includes(card)}
                onToggle={() => toggle_card(card)}
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
    <Tooltip disableHoverableContent={true}>
      <TooltipTrigger>
        <div
          className={`text-xs border-4 border-gray-400 rounded-lg w-22 h-20 p-px flex flex-col shrink-0 grow-0 justify-between text-center ${card_bg(card_info)} ${className}`}
          {...props}
        >
          <p className="text-black">{card_info.name}</p>
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="flex flex-col flex-wrap text-center z-51">
          <b>{card_info.types.join(" & ")}</b>
          <Separator />
          {card_descriptions[card_info.name]}
        </div>
      </TooltipContent>
    </Tooltip>
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
  if (card_info.types.includes(CardTypes.ATTACK)) {
    return "bg-red-300";
  }
  return "bg-white";
}

function CardButton({
  card,
  selected,
  onToggle,
}: {
  card: Card;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <CardShell
      card_info={card.info}
      className={
        selected
          ? "border-green-400 hover:border-green-600"
          : "border-red-600 hover:border-red-800"
      }
      onClick={onToggle}
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

export function GoldCoin({ cost }: { cost: number }) {
  return (
    <span className="bg-yellow-300 text-black rounded-full w-6 h-6 inline-flex items-center justify-center">
      {cost}
    </span>
  );
}

function ChooseCardsList({ extra_cards }: { extra_cards: Card[] }) {
  const [choices, toggle_choice, reset_choices] = useSelection<Card>();
  const message = useLobbyStore((state) => state.message as PickCardsRequest);
  const set_message = useLobbyStore((state) => state.set_message);

  return (
    <CardSelectionPopup
      description={message.description}
      content={
        <div className="flex flex-row flex-wrap justify-center">
          {extra_cards.map((card) => (
            <CardButton
              key={card.id}
              card={card}
              selected={choices.includes(card)}
              onToggle={() => toggle_choice(card)}
            />
          ))}
        </div>
      }
      footer={
        <Button
          onClick={() => {
            const res: PickCardsResponse = {
              kind: MessageKinds.PICK_CARDS_RESPONSE,
              choices: choices,
            };
            set_message(undefined);
            reset_choices();
            game_socket?.send(JSON.stringify(res));
          }}
          disabled={
            choices.length > message.max || choices.length < message.min
          }
        >
          Confirm Choices
        </Button>
      }
    />
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
    <CardSelectionPopup
      description={message.description}
      content={<CardDisplay key={message.card.id} card={message.card} />}
      footer={
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
      }
    />
  );
}

function CardSelectionPopup({
  description,
  content,
  footer,
}: {
  description: string;
  content?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Sheet defaultOpen={true}>
      <SheetTrigger>
        <div className="w-screen fixed bottom-0 left-0">
          <div className="flex justify-center">
            <Button className="w-1/3 h-auto text-center rounded-t-lg rounded-b-none">
              <UpChevron />
            </Button>
          </div>
        </div>
      </SheetTrigger>
      <SheetContent
        className="text-center"
        side="bottom"
        showCloseButton={false}
      >
        <SheetClose>
          <Button className="rounded-t-none rounded-b-lg w-1/3">
            <DownChevron />
          </Button>
        </SheetClose>
        <SheetHeader>
          <h2>{description}</h2>
        </SheetHeader>

        <div className="text-center">{content}</div>

        <SheetFooter className="text-center sm:justify-center justify-center">
          <SheetClose>{footer}</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function UpChevron() {
  return <span>&#9650;</span>;
}

function DownChevron() {
  return <span>&#9660;</span>;
}

// function PopUp({children}) {
//   <div className="bg-black z-1">
//   </div>
// }
