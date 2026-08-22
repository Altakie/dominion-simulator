import { type ReactNode, type Ref, useEffect, useRef } from "react";
import "./App.css";
import { type Card, type CardInfo, CardTypes, same_card } from "shared/cards";
import {
  type CardsLogEventKind,
  type LogEntry,
  LogEventKinds,
} from "shared/log";
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
import { useShallow } from "zustand/shallow";
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
import { PlayerDisplay, useLobbyStore } from "./Lobby";
import { cn } from "./lib/utils.ts";

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
      <div className="flex-col w-4/5 border h-screen overflow-auto">
        <VisualSupply supply={game_state.supply} />
        <GameStateBar />
        <PlayedCards played_cards={game_state.played_cards} />
        <div>
          <GameAreaTitle title="YOUR HAND" />
          <div className="flex flex-row flex-nowrap items-start justify-center px-2">
            <div className="w-1/5">
              <DeckAndDiscard />
            </div>
            <Separator orientation="vertical" />
            <div className="flex-1">
              <Hand hand={player.hand} />
            </div>
            <div className="w-1/5" />
          </div>
        </div>
        {/* {choices} */}
        {pop_up}
      </div>
      <div className="flex flex-col w-1/5 border h-screen gap-2 p-2 overflow-hidden">
        <PlayerList />
        <div className="min-h-0">
          <Log />
        </div>
      </div>
    </div>
  );
}

export function GameAreaTitle({ title }: { title: string }) {
  return (
    <div className="flex gap-2 flex-row flex-nowrap items-center my-2">
      <div className="flex-1">
        <Separator />
      </div>
      <div>
        <p className="text-foreground text-sm">{title}</p>
      </div>
      <div className="flex-1">
        <Separator />
      </div>
    </div>
  );
}

function Description() {
  const message = useLobbyStore((state) => state.message);
  if (message && request_message_kinds.has(message.kind)) {
    const req = message as RequestMessage;

    return <p className="text-foreground line-clamp-2">{req.description}</p>;
  }
  return <p className="text-muted-foreground line-clamp-2">Nothing to do</p>;
}

function PlayerList() {
  const players = useLobbyStore((state) => state.player_game_infos);
  const game_state = useLobbyStore((state) => state.game_state)!;

  return (
    <div className="flex flex-col flex-nowrap gap-1 h-fit">
      <GameAreaTitle title="PLAYERS" />
      {players.map((player, index) => {
        let highlight: "current" | "attacked" | "none" = "none";
        if (index === game_state.current_player_index) {
          highlight = "current";
        } else if (index === game_state.attack_index) {
          highlight = "attacked";
        }

        return (
          <PlayerDisplay
            key={player.name}
            name={player.name}
            highlight={highlight}
            under={`${player.total_cards} cards`}
            right={`${player.victory_points}`}
          />
        );
      })}
    </div>
  );
}

function GameStateBar() {
  const game_state = useLobbyStore((state) => state.game_state)!;
  return (
    <div>
      <Separator />
      <div className="text-sm bg-card">
        <div
          className="
        flex flex-row flex-nowrap items-center justify-center p-2 gap-2"
        >
          <div className="text-black">
            <b>Turn {game_state.turn_number}</b>
          </div>
          <div className="rounded-full bg-primary px-2 text-white">
            {game_state.phase} Phase
          </div>

          <Separator orientation="vertical" />
          <div
            className="rounded-full w-4 h-4 bg-gray-400
          flex items-center justify-center text-center
          "
          >
            <b>{game_state.actions}</b>
          </div>
          <div>Actions</div>

          <Separator orientation="vertical" />
          <div className="flex flex-row gap-1 items-center">
            <div
              className="rounded-full w-4 h-4 bg-gray-400
          flex items-center justify-center text-center
          "
            >
              <b>{game_state.buys}</b>
            </div>
            <div>Buys</div>
          </div>

          <Separator orientation="vertical" />
          <div className="flex flex-row gap-1 items-center">
            <div>
              <GoldCoin cost={game_state.money} />
            </div>
            <div>Money</div>
          </div>
          <Separator orientation="vertical" />
        </div>

        <div className="flex flex-row flex-nowrap items-center justify-center gap-2 min-h-12 p-2">
          <Description />
          <ConfirmChoicesButton />
        </div>
      </div>
      <Separator />
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
      <GameAreaTitle title="PLAYED THIS TURN" />
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

function ConfirmChoicesButton() {
  const message = useLobbyStore((state) => state.message);
  const setMessage = useLobbyStore((state) => state.set_message);
  const selected_stacks = useLobbyStore((state) => state.selected_stacks);
  const reset_stacks = useLobbyStore((state) => state.reset_stacks);
  const selected_cards = useLobbyStore((state) => state.selected_cards);
  const reset_cards = useLobbyStore((state) => state.reset_cards);

  let pick_stacks_req: PickSupplyPileRequest | undefined;
  if (message && message.kind === MessageKinds.PICK_SUPPLY_PILE_REQUEST) {
    pick_stacks_req = message as PickSupplyPileRequest;
  }
  let pick_cards_req: PickCardsRequest | undefined;
  if (message && message.kind === MessageKinds.PICK_CARDS_REQUEST) {
    pick_cards_req = message as PickCardsRequest;
  }

  if (pick_cards_req) {
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
            useLobbyStore.getState().send_message(res);
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
  }

  if (pick_stacks_req) {
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
            useLobbyStore.getState().send_message(res);
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
  }
}

function VisualSupply({ supply }: { supply: Supply }) {
  const [message, selected_stacks, toggle_stack] = useLobbyStore(
    useShallow((state) => [
      state.message,
      state.selected_stacks,
      state.toggle_stack,
    ]),
  );

  let pick_stacks_req: PickSupplyPileRequest | undefined;
  if (message && message.kind === MessageKinds.PICK_SUPPLY_PILE_REQUEST) {
    pick_stacks_req = message as PickSupplyPileRequest;
  }

  return (
    <>
      <GameAreaTitle title="SUPPLY" />
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
    <CardShell
      card_info={supply_stack.card}
      className={supply_stack.count > 0 ? "" : "bg-gray-400"}
    >
      <div className="flex flex-row justify-between">
        <GoldCoin cost={supply_stack.card.cost} />
        <div
          className={cn(
            supply_stack.count > 0 ? "bg-red-800" : "bg-gray-700",
            "text-white rounded-sm w-6 h-6 flex justify-center items-center",
          )}
        >
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
      className={`${
        selected
          ? "border-green-400 hover:border-green-600 -translate-y-2"
          : "border-red-600 hover:border-red-800"
      }`}
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

function DeckAndDiscard() {
  const player_info = useLobbyStore((state) => state.player);
  return (
    player_info && (
      <div className="flex flex-row flex-nowrap justify-start gap-2">
        <div className="flex flex-col justify-start items-center">
          <CardShape
            height={20}
            className="bg-black text-white border-background items-center justify-center text-lg"
          >
            <b>{player_info.deck_size}</b>
          </CardShape>
          <p className="text-foreground text-xs">DECK</p>
        </div>
        <div className="flex flex-col justify-start items-center">
          {player_info.top_of_discard_pile ? (
            <CardDisplay card={player_info.top_of_discard_pile} />
          ) : (
            <CardShape
              height={20}
              className="bg-gray-400 items-center justify-center text-sm text-black border-none"
            >
              EMPTY
            </CardShape>
          )}
          <p className="text-foreground text-xs">
            DISCARD - {player_info.discard_pile_size}
          </p>
        </div>
      </div>
    )
  );
}

function Hand({ hand }: { hand: Card[] }) {
  const message = useLobbyStore((state) => state.message);
  const _setMessage = useLobbyStore((state) => state.set_message);

  const [selected_cards, toggle_card] = useLobbyStore(
    useShallow((state) => [state.selected_cards, state.toggle_card]),
  );

  let pick_cards_req: PickCardsRequest;
  if (message && message.kind === MessageKinds.PICK_CARDS_REQUEST) {
    pick_cards_req = message as PickCardsRequest;
  }

  return (
    <div className="flex flex-row flex-wrap gap-4 items-start justify-center">
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
  );
}

const CARD_SIZES = {
  20: "w-18 h-20",
} as const;

export function CardShape({
  className = "",
  height,
  ...props
}: {
  height: keyof typeof CARD_SIZES;
} & React.HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        `text-xs border-2 border-gray-400 rounded-lg ${CARD_SIZES[height]} p-1 flex flex-col justify-between text-center`,
        className,
      )}
      {...props}
    />
  );
}

export function CardShell({
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
        <CardShape
          className={cn(
            "transition-transform duration-300",
            card_bg(card_info),
            className,
          )}
          height={20}
          {...props}
        >
          <p className="text-black">{card_info.name}</p>
          {children}
        </CardShape>
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
          ? "border-green-400 hover:border-green-600 -translate-y-2"
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

function group_consecutive_log_entries(events: LogEntry[]): LogEntry[] {
  const grouped: LogEntry[] = [];
  for (const event of events) {
    const last = grouped[grouped.length - 1];
    if (
      last &&
      "cards" in last &&
      "cards" in event &&
      last.kind === event.kind &&
      last.player_name === event.player_name
    ) {
      grouped[grouped.length - 1] = {
        ...last,
        cards: [...last.cards, ...event.cards],
      };
      continue;
    }
    grouped.push(event);
  }
  return grouped;
}

function Log() {
  const log_messages = useLobbyStore((state) => state.log_messages);

  return (
    <div className="flex flex-col h-full min-h-0">
      <GameAreaTitle title="LOG" />
      <div className="flex-1 min-h-0 overflow-auto">
        {log_messages.map((turn) => {
          const grouped_events = group_consecutive_log_entries(turn.events);
          return (
            <div
              key={turn.turn_number.toString() + turn.active_player_name}
              className="flex flex-col items-center justify-center p-1"
            >
              <div className="bg-card rounded-md flex flex-row justify-between items-center text-sm p-2 w-full sticky top-0">
                <div>
                  <b>Turn {turn.turn_number}</b> : {turn.active_player_name}
                </div>
                <div className="text-fg">{turn.events.length} events</div>
              </div>
              <div className="flex flex-col flex-nowrap gap-1 text-sm w-7/10">
                {grouped_events.map((entry, entry_index) => (
                  <p
                    // biome-ignore lint/suspicious/noArrayIndexKey: grouped entries have no stable id
                    key={entry_index}
                    className="border-l px-2 py-1 border-gray-400 flex flex-row flex-wrap items-center gap-1"
                  >
                    <LogEntryDisplay entry={entry} />
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlayerNameLabel({ name }: { name: string }) {
  return <span className="font-semibold">{name}</span>;
}

function CardPill({ card_info }: { card_info: CardInfo }) {
  return (
    <span className={cn("rounded px-1 text-black", card_bg(card_info))}>
      {card_info.name}
    </span>
  );
}

function CardListEntry({
  player_name,
  verb,
  cards,
}: {
  player_name: string;
  verb: string;
  cards: CardInfo[];
}) {
  return (
    <>
      <PlayerNameLabel name={player_name} />
      <span>{verb}</span>
      {cards.map((card_info, card_index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: merged cards have no stable id
          key={card_index}
        >
          <CardPill card_info={card_info} />
          {card_index < cards.length - 1 ? "," : null}
        </span>
      ))}
    </>
  );
}

const CARD_LIST_VERBS: Record<CardsLogEventKind, string> = {
  [LogEventKinds.PLAYED]: "played",
  [LogEventKinds.DISCARDED]: "discarded",
  [LogEventKinds.GAINED]: "gained",
  [LogEventKinds.TRASHED]: "trashed",
};

function LogEntryDisplay({ entry }: { entry: LogEntry }) {
  switch (entry.kind) {
    case LogEventKinds.PLAYED:
    case LogEventKinds.DISCARDED:
    case LogEventKinds.GAINED:
    case LogEventKinds.TRASHED:
      return (
        <CardListEntry
          player_name={entry.player_name}
          verb={CARD_LIST_VERBS[entry.kind]}
          cards={entry.cards}
        />
      );
    case LogEventKinds.DREW:
      return (
        <>
          <PlayerNameLabel name={entry.player_name} />
          <span>drew {entry.count} cards</span>
        </>
      );
    case LogEventKinds.NO_CARDS_TO_DISCARD:
      return (
        <>
          <PlayerNameLabel name={entry.player_name} />
          <span>has no cards to discard</span>
        </>
      );
    case LogEventKinds.REVEALED_REACTION:
      return (
        <>
          <PlayerNameLabel name={entry.player_name} />
          <span>revealed</span>
          <CardPill card_info={entry.card} />
          <span>in response to attack</span>
        </>
      );
  }
}

export function GoldCoin({ cost }: { cost: number }) {
  return (
    <span className="bg-yellow-300 text-black rounded-full w-6 h-6 inline-flex items-center justify-center">
      {cost}
    </span>
  );
}

function ChooseCardsList({ extra_cards }: { extra_cards: Card[] }) {
  const [selected_cards, toggle_card, reset_cards] = useLobbyStore(
    useShallow((state) => [
      state.selected_cards,
      state.toggle_card,
      state.reset_cards,
    ]),
  );

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
              selected={selected_cards.includes(card)}
              onToggle={() => toggle_card(card)}
            />
          ))}
        </div>
      }
      footer={
        <Button
          onClick={() => {
            const res: PickCardsResponse = {
              kind: MessageKinds.PICK_CARDS_RESPONSE,
              choices: selected_cards,
            };
            set_message(undefined);
            reset_cards();
            useLobbyStore.getState().send_message(res);
          }}
          disabled={
            selected_cards.length > message.max ||
            selected_cards.length < message.min
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
    useLobbyStore.getState().send_message(res);
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
