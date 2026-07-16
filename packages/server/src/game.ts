import type { WSContext } from "hono/ws";
import {
  GamePhases,
  type GameState,
  type Player,
  type PlayerEndInfo,
  type SharablePlayer,
} from "shared";
import {
  type Card,
  type CardInfo,
  type CardName,
  CardTypes,
} from "shared/cards";
import { Copper } from "shared/cards/treasures";
import { Estate, Province } from "shared/cards/victories";
import { Deque } from "shared/deque";
import {
  type BinaryDescription,
  BinaryDescriptions,
  type GainDescription,
  type GameEndMessage,
  type GameStateUpdateMessage,
  type LogMessage,
  type Message,
  MessageKinds,
  type PickCardsDescription,
  PickCardsDescriptions,
  type PickCardsRequest,
  type PickCardsResponse,
  type PickSupplyPileRequest,
  type PickSupplyPileResponse,
  type PickYesNoRequest,
  type PickYesNoResponse,
  type PlayerNamesMessage,
  type StartedMessage,
  serializeMessage,
} from "shared/messages";
import { shuffle } from "shared/shuffle";
import { Supply, type supplyStack } from "shared/supply";
import { effect_table } from "./effects";
import type { Lobby, PlayerLobbyInfo } from "./lobby";
import { AISocket, type MessageSink } from "./socket";

type WaitResponses =
  | typeof MessageKinds.PICK_CARDS_RESPONSE
  | typeof MessageKinds.PICK_SUPPLY_PILE_RESPONSE
  | typeof MessageKinds.PICK_YES_NO_RESPONSE;

interface Cc {
  wait: boolean;
}

interface WaitInfo extends Cc {
  wait: true;
  player_info: PlayerInfo;
  response_type: WaitResponses;
  request: Message;
  cc: (response: Message) => void;
}

export interface NonBlockingCc extends Cc {
  wait: false;
  cc: () => void;
}

class WaitQueue {
  wait_queue: Deque<Cc>;

  constructor() {
    this.wait_queue = new Deque();
  }

  resolve(response: Message, clientid: string) {
    console.log("Resolving response");
    const front = this.wait_queue.peek_front();
    if (front === undefined) {
      return;
    }
    if (!front.wait) {
      console.log("Front is not a waiter?");
      return;
    }

    const wait_info = front as WaitInfo;

    if (clientid !== wait_info.player_info.clientid) {
      console.log("Wrong Player sent response");
      return;
    }
    if (response.kind !== wait_info.response_type) {
      console.log("Wrong response type");
      return;
    }
    console.log(`Player responded with ${response.kind}`);

    // NOTE: Popping is handled within the prompt methods
    wait_info.cc(response);

    while (
      this.wait_queue.peek_front() !== undefined &&
      !this.wait_queue.peek_front()?.wait
    ) {
      const non_blocking = this.wait_queue.pop_front() as NonBlockingCc;
      non_blocking.cc();
    }
  }

  push_front(cc: Cc) {
    this.wait_queue.push_front(cc);
  }

  pop_front(): Cc | undefined {
    return this.wait_queue.pop_front();
  }

  peek_front(): Cc | undefined {
    return this.wait_queue.peek_front();
  }

  peek_front_waiting(): WaitInfo | undefined {
    const front = this.peek_front();
    if (!this.peek_front()?.wait) {
      return undefined;
    }

    return front as WaitInfo;
  }

  push_back(cc: Cc) {
    this.wait_queue.push_back(cc);
  }

  isEmpty(): boolean {
    return this.wait_queue.isEmpty();
  }
}

function new_game_state(
  current_player_index: number,
  supply: Supply,
): GameState {
  return {
    current_player_index: current_player_index,
    phase: GamePhases.ACTION,

    turn_number: 1,

    attack_index: null,

    supply: supply,
    played_cards: [],

    trash_pile: [],

    actions: 1,
    money: 0,
    buys: 1,
  };
}

export type PlayerInfo = {
  player: Player;
  clientid: string;
  socket: MessageSink;
};

// TODO: Should game be under a read write lock to avoid wait conditions?
export class Game {
  lobby: Lobby;

  player_infos: PlayerInfo[];
  game_state: GameState;
  wait_queue: WaitQueue;
  event_log: string[];
  card_count: number;

  constructor(players: PlayerLobbyInfo[], lobby: Lobby) {
    this.lobby = lobby;

    this.card_count = 0;
    this.wait_queue = new WaitQueue();
    this.event_log = [];

    const player_infos = players.map((player): PlayerInfo => {
      return {
        player: this.new_player(player.name),
        clientid: player.clientid,
        socket: player.socket,
      };
    });
    this.player_infos = shuffle(player_infos);

    this.game_state = new_game_state(0, new Supply(players.length));

    // DEBUG MODE TOGGLE
    if (
      process.env.DEBUG?.toLowerCase().trim() === "1" ||
      process.env.DEBUG?.toLowerCase().trim() === "true"
    ) {
      this.game_state.supply.toggleDebugMode();
    }
  }

  new_card(card_info: CardInfo): Card {
    // TODO: I know nathaniel used date time, but since all starting cards are being made in quick succession idk if its safe to use here
    const card: Card = {
      id: this.card_count.toString(),
      info: card_info,
    };

    this.card_count++;

    return card;
  }

  new_player(name: string): Player {
    let deck: Card[] = [];
    for (let i = 0; i < 7; i++) {
      deck.push(this.new_card(Copper));
    }
    for (let i = 0; i < 3; i++) {
      deck.push(this.new_card(Estate));
    }
    deck = shuffle(deck);
    return {
      name: name,
      hand: [],
      deck: deck,
      discard_pile: [],
      victory_points: 3,
    };
  }

  get_current_player(): Player {
    return this.get_player(this.game_state.current_player_index);
  }

  get_current_player_info(): PlayerInfo {
    return this.get_player_info(this.game_state.current_player_index);
  }

  get_player_info(index: number): PlayerInfo {
    return this.player_infos[index]!;
  }

  get_player(index: number): Player {
    return this.player_infos[index]!.player;
  }

  get_players(): Player[] {
    return this.player_infos.map((player_info) => player_info.player);
  }

  get_players_by_turn_order(): Player[] {
    const current_player_index = this.game_state.current_player_index;
    return this.player_infos
      .map((player_info) => player_info.player)
      .slice(current_player_index)
      .concat(
        this.player_infos
          .map((player_info) => player_info.player)
          .slice(0, current_player_index),
      );
  }

  get_player_names(): string[] {
    return this.player_infos.map((player_info) => player_info.player.name);
  }

  new_turn(next_player_index: number) {
    this.game_state.phase = GamePhases.ACTION;
    this.game_state.current_player_index = next_player_index;

    // console.log(`Current hand: ${[...this.get_current_player().hand.map((card) => card.info.name)]}`)

    this.game_state.played_cards = [];

    this.game_state.actions = 1;
    this.game_state.money = 0;
    this.game_state.buys = 1;

    this.send_log_message(
      `Turn ${this.game_state.turn_number} - ${this.get_current_player().name}`,
    );
  }

  next_turn() {
    if (this.game_state.current_player_index === this.player_infos.length - 1) {
      this.game_state.turn_number += 1;
    }

    const player = this.get_current_player();
    this.discard_hand(player);
    while (this.game_state.played_cards.length > 0) {
      this.discard_card(player, 0, this.game_state.played_cards);
    }
    this.draw_cards(player, 5);

    this.new_turn(
      (this.game_state.current_player_index + 1) % this.player_infos.length,
    );
    // TODO: Send a message to all players that the next turn started
    // This should probably be a special new turn message instead of a general update message
    this.action_phase();
  }

  send_update() {
    for (const player_info of this.player_infos) {
      const update_message: GameStateUpdateMessage = {
        kind: MessageKinds.GAME_STATE_UPDATE,

        game_state: this.game_state,
        player: toSharablePlayer(player_info.player),
      };

      const serialized_message = serializeMessage(update_message);
      player_info.socket.send(serialized_message);
    }
  }

  start_game() {
    for (const player of this.player_infos) {
      this.draw_cards(player.player, 5);
    }

    this.new_turn(0);

    for (const player_info of this.player_infos.values()) {
      const started_msg: StartedMessage = {
        kind: MessageKinds.STARTED,
        player_name_order: this.get_player_names(),
        state: this.game_state,

        player: toSharablePlayer(player_info.player),
      };

      const started_msg_str = serializeMessage(started_msg);
      player_info.socket.send(started_msg_str);
    }

    this.action_phase();
  }

  reconnect_player(clientid: string, socket: MessageSink) {
    for (const player_info of this.player_infos) {
      if (player_info.clientid === clientid) {
        player_info.socket = socket;
        const started_msg: StartedMessage = {
          kind: MessageKinds.STARTED,
          player_name_order: this.get_player_names(),
          state: this.game_state,

          player: toSharablePlayer(player_info.player),
        };

        socket.send(serializeMessage(started_msg));

        if (
          this.wait_queue.peek_front_waiting()?.player_info.clientid ===
          clientid
        ) {
          // Resend message if the player the game is waiting on reconnected
          socket.send(
            serializeMessage(this.wait_queue.peek_front_waiting()!.request),
          );
        }

        const log_message: LogMessage = {
          kind: MessageKinds.LOG,
          log_messages: this.event_log,
        };

        socket.send(serializeMessage(log_message));
        // break;
      }
      const started_msg: StartedMessage = {
        kind: MessageKinds.STARTED,
        player_name_order: this.get_player_names(),
        state: this.game_state,

        player: toSharablePlayer(player_info.player),
      };

      socket.send(serializeMessage(started_msg));
    }
  }

  resolve_player_choice(clientid: string, response: Message) {
    if (this.wait_queue.isEmpty()) {
      console.log("No wait info");
      return;
    }
    console.log("Going to resolve");
    this.wait_queue.resolve(response, clientid);

    // WARN: Assuming that there are no errors
    // this.wait_info = undefined
  }

  // eventually_cleanup(cleanup: () => void) {
  //   if (this.wait_infos === undefined) {
  //     cleanup();
  //   } else {
  //     const old_next = this.wait_infos.next;
  //     this.wait_infos.next = (response: Message) => {
  //       old_next(response);
  //       this.eventually_cleanup(cleanup);
  //     };
  //   }
  // }

  action_phase() {
    this.send_update();
    const end_phase = () => {
      this.game_state.phase = GamePhases.MONEY;
      console.log(`End of action phase ${this.game_state.turn_number}`);
      // this.send_update();
      this.money_phase();
    };

    if (this.game_state.actions > 0) {
      // Prompt the player to play an action card from their hand as long as they have actions
      const hand = this.get_current_player().hand;
      const initial_choices = hand.filter((card) =>
        card.info.types.includes(CardTypes.ACTION),
      );
      if (initial_choices.length === 0) {
        end_phase();
        return;
      }

      const next = (choices: Card[]) => {
        if (choices.length > 1) {
          // TODO: Maybe allow players to play multiple cards at a time if it's valid?
          console.log("Cannot play more than one card at a time");
        }
        // TODO: Reprompt if it goes wrong
        if (!isSubset(choices, initial_choices)) {
          console.log("Error: Improper Choice");
          return;
        }

        if (choices.length === 0) {
          end_phase();
          return;
        }

        const card_index = hand.findIndex((card) => card.id === choices[0]!.id);
        console.log(
          `Player chose ${choices[0]!.info.name} which has an index of ${card_index}`,
        );

        this.game_state.actions--;
        // Resolve the action effect
        this.play_card(card_index, hand);
        const cleanup = () => {
          // Send the new gamestate to all players
          // this.send_update();
          // Run the action phase again
          this.action_phase();
        };

        // TODO: Need to wait for cards that require subsequent choices to finish their next funcs or smth
        // WARN: This might not work if the card has multiple chained effects
        // It will cleanup and go to the next phase after the first effect
        // Unless the effects are chained within the card, which should be the case
        if (!this.wait_queue.isEmpty()) {
          const cleanup_cc: NonBlockingCc = { wait: false, cc: cleanup };
          this.wait_queue.push_back(cleanup_cc);
          return;
        }

        cleanup();
        // this.eventually_cleanup(cleanup);
        return;
      };

      this.prompt_pick_card(
        this.get_current_player_info(),
        PickCardsDescriptions.PLAY,
        initial_choices,
        0,
        1,
        next,
      );
      return;
    }

    end_phase();
  }

  money_phase() {
    // play all treasure cards from hand and resolve them
    const hand = this.get_current_player().hand;
    for (let i = hand.length - 1; i >= 0; i--) {
      const card = hand[i]!;
      console.log(`Card: ${card.info.name}`);
      if (card.info.types.includes(CardTypes.TREASURE)) {
        this.play_card(i, hand);
      }
    }

    this.game_state.phase = GamePhases.BUY;
    this.send_update();
    this.buy_phase();
  }

  buy_phase() {
    // prompt the player to buy as many cards as they have buys from the supply
    //
    this.send_update();
    const end_phase = () => {
      console.log(`End of buy phase ${this.game_state.turn_number}`);
      // this.send_update();
      if (this.game_over()) {
        this.send_game_over();
        return;
      }
      this.next_turn();
    };

    if (this.game_state.buys > 0) {
      // Prompt the player to pick a singular supply pile
      const supply_piles = this.game_state.supply
        .getStacks()
        .filter(
          (pile) => pile.card.cost <= this.game_state.money && pile.count > 0,
        );
      const next = (choices: supplyStack[]) => {
        // TODO: Reprompt the buy if it goes wrong??
        if (choices.length > 1) {
          // TODO: Maybe allow players to buy multiple cards at a time if it's valid?
          console.log("Cannot buy more than one card at a time");
          return;
        }
        if (!isSubset(choices, supply_piles)) {
          console.log("Error: Improper Supply Pile Choice");
          return;
        }

        if (choices.length === 0) {
          end_phase();
          return;
        }
        const choice = choices[0]!;

        // Gain the bought card to the discard pile
        const player = this.get_current_player();
        this.gain_card(player, choice.card.name, player.discard_pile);
        this.game_state.money -= choice.card.cost;
        this.game_state.buys--;

        // Send the new gamestate to all players
        // this.send_update();
        // Run the action phase again
        this.buy_phase();
      };

      this.prompt_gain_card(
        this.get_current_player_info(),
        "Choose a card to gain from the supply",
        supply_piles,
        0,
        1,
        next,
      );
      return;
    }

    end_phase();
  }

  prompt_pick_card(
    player: PlayerInfo,
    description: string,
    choices: Card[],
    min: number,
    max: number,
    next: (choices: Card[]) => void,
  ) {
    const req: PickCardsRequest = {
      kind: MessageKinds.PICK_CARDS_REQUEST,

      description: description,

      choices: choices,
      min: min,
      max: max,
    };

    const wrapped_next = (response: Message): void => {
      const res = response as PickCardsResponse;
      // If response is wrong, resend request
      if (
        res.choices.length > req.max ||
        res.choices.length < req.min ||
        !isSubset(res.choices, req.choices)
      ) {
        const req_str = serializeMessage(req);
        player.socket.send(req_str);

        return;
      }

      this.wait_queue.pop_front();
      next(res.choices);
    };

    const req_str = serializeMessage(req);
    const waiting: WaitInfo = {
      wait: true,
      request: req,
      player_info: player,
      response_type: MessageKinds.PICK_CARDS_RESPONSE,
      cc: wrapped_next,
    };
    this.wait_queue.push_front(waiting);
    player.socket.send(req_str);
  }

  prompt_binary_choice(
    player: PlayerInfo,
    description: string,
    card: Card,
    next: (choice: boolean) => void,
  ) {
    const req: PickYesNoRequest = {
      kind: MessageKinds.PICK_YES_NO_REQUEST,
      description: description,
      card: card,
    };

    const wrapped_next = (response: Message): void => {
      const res = response as PickYesNoResponse;
      this.wait_queue.pop_front();

      next(res.choice);
    };

    const req_str = serializeMessage(req);
    const waiting: WaitInfo = {
      wait: true,
      request: req,
      player_info: player,
      response_type: MessageKinds.PICK_YES_NO_RESPONSE,
      cc: wrapped_next,
    };
    this.wait_queue.push_front(waiting);
    player.socket.send(req_str);
  }

  prompt_gain_card(
    player: PlayerInfo,
    description: string,
    choices: supplyStack[],
    min: number,
    max: number,
    next: (choices: supplyStack[]) => void,
  ) {
    const req: PickSupplyPileRequest = {
      kind: MessageKinds.PICK_SUPPLY_PILE_REQUEST,
      description: description,
      choices: choices,
      min: min,
      max: max,
    };

    const wrapped_next = (response: Message): void => {
      const res = response as PickSupplyPileResponse;
      if (
        res.choices.length > req.max ||
        res.choices.length < req.min ||
        !isSubset(res.choices, req.choices)
      ) {
        const req_str = serializeMessage(req);
        player.socket.send(req_str);

        return;
      }

      this.wait_queue.pop_front();

      next(res.choices);
    };

    const req_str = serializeMessage(req);
    const waiting: WaitInfo = {
      wait: true,
      request: req,
      player_info: player,
      response_type: MessageKinds.PICK_SUPPLY_PILE_RESPONSE,
      cc: wrapped_next,
    };
    this.wait_queue.push_front(waiting);
    player.socket.send(req_str);
  }

  draw_cards(player: Player, num_cards: number) {
    for (let i = 0; i < num_cards; i++) {
      if (player.deck.length === 0) {
        if (player.discard_pile.length === 0) {
          return;
        }
        player.deck = shuffle(player.discard_pile);
        player.discard_pile = [];
      }
      const card = player.deck.pop()!;
      player.hand.push(card);
    }

    const log_message = `${player.name} drew ${num_cards} cards`;
    console.log(log_message);
    this.send_log_message(log_message);
  }

  play_card(card_index: number, pile: Card[]) {
    const card = this.remove_card(card_index, pile);
    this.game_state.played_cards.push(card);

    const log_message = `${this.get_current_player().name} played ${card.info.name}`;
    console.log(log_message);
    this.send_log_message(log_message);

    effect_table[card.info.name](this);
  }

  discard_card(player: Player, card_index: number, initial_pile: Card[]) {
    if (initial_pile === player.deck && player.deck.length === 0) {
      player.deck = shuffle(player.discard_pile);
      player.discard_pile = [];
      initial_pile = player.deck;
      card_index = player.deck.length - 1;
    }
    if (initial_pile.length === 0) {
      console.log("No cards to discard");
      this.send_log_message(`${player.name} has no cards to discard`);
      return;
    }
    const card = this.remove_card(card_index, initial_pile);
    player.discard_pile.push(card);

    const log_message = `${player.name} discarded ${card?.info.name}`;
    console.log(log_message);
    this.send_log_message(log_message);
  }

  discard_hand(player: Player) {
    while (player.hand.length > 0) {
      this.discard_card(player, 0, player.hand);
    }
  }

  gain_card(player: Player, card_name: CardName, pile: Card[]) {
    const card = this.game_state.supply.gainCard(card_name);
    if (card) {
      pile.push(card);
      player.victory_points = this.calculate_victory_points(player);

      const log_message = `${player.name} gained ${card?.info.name}`;
      console.log(log_message);
      this.send_log_message(log_message);
    }
  }

  trash_card(player: Player, card_index: number, pile: Card[]) {
    const card = this.remove_card(card_index, pile);
    this.game_state.trash_pile.push(card);
    player.victory_points = this.calculate_victory_points(player);

    const log_message = `${player.name} trashed ${card?.info.name}`;
    console.log(log_message);
    this.send_log_message(log_message);
  }

  remove_card(card_index: number, pile: Card[]): Card {
    return pile.splice(card_index, 1)[0]!;
  }

  calculate_victory_points(player: Player): number {
    let points = 0;
    const all_cards = [
      ...player.discard_pile,
      ...player.hand,
      ...this.game_state.played_cards,
      ...player.deck,
    ];
    for (const card of all_cards) {
      switch (card.info.name) {
        case "Estate":
          points += 1;
          break;
        case "Duchy":
          points += 3;
          break;
        case "Province":
          points += 6;
          break;
        case "Curse":
          points -= 1;
          break;
        case "Gardens":
          points += Math.floor(all_cards.length / 10);
          break;
      }
    }
    return points;
  }

  game_over(): boolean {
    const empty_piles_count = this.game_state.supply
      .getStacks()
      .filter((stack) => stack.count === 0).length;
    const province_count = this.game_state.supply
      .getStacks()
      .find((stack) => stack.card === Province)?.count;

    return empty_piles_count >= 3 || province_count === 0;
  }

  send_game_over() {
    const player = this.get_current_player();
    this.discard_hand(player);
    while (this.game_state.played_cards.length > 0) {
      this.discard_card(player, 0, this.game_state.played_cards);
    }

    const player_end_infos: PlayerEndInfo[] = this.player_infos.map(
      (player_info): PlayerEndInfo => {
        this.discard_hand(player_info.player);
        const final_deck = player_info.player.deck
          .concat(player_info.player.discard_pile)
          .sort((a, b) => a.info.name.localeCompare(b.info.name));

        return {
          name: player_info.player.name,
          victory_points: player_info.player.victory_points,
          final_deck: final_deck,
        };
      },
    );

    player_end_infos.sort((a, b) => b.victory_points - a.victory_points);
    const game_end_message: GameEndMessage = {
      kind: MessageKinds.GAME_END,

      players_end_infos_in_victory_order: player_end_infos,
    };
    const serialized_game_end_message = serializeMessage(game_end_message);
    for (const player_info of this.player_infos) {
      player_info.socket.send(serialized_game_end_message);
    }

    const players_in_lobby_message: PlayerNamesMessage = {
      kind: MessageKinds.PLAYER_NAMES,

      player_names: this.lobby.get_player_names(),
    };
    const serialized_names = serializeMessage(players_in_lobby_message);

    for (const player_info of this.player_infos) {
      player_info.socket.send(serialized_names);
    }
    this.lobby.game = undefined;
  }

  send_log_message(...log_messages: string[]) {
    const msg: LogMessage = {
      kind: MessageKinds.LOG,

      log_messages: log_messages,
    };

    this.event_log.push(...log_messages);

    const ser_msg = serializeMessage(msg);
    for (const player_info of this.player_infos) {
      player_info.socket.send(ser_msg);
    }
    this.send_update();
  }
}

function isSubset(subset: any[], set: any[]): boolean {
  for (const member of subset) {
    if (set.includes(member!)) {
      return false;
    }
  }

  return true;
}

function toSharablePlayer(player: Player): SharablePlayer {
  return {
    name: player.name,
    hand: player.hand,
    victory_points: player.victory_points,
    deck_size: player.deck.length,
    discard_pile_size: player.discard_pile.length,
    top_of_discard_pile: player.discard_pile[player.discard_pile.length - 1],
  };
}
