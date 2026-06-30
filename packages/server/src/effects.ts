import type { Player } from "shared";
import { type Card, type CardName, CardTypes } from "shared/cards";
import { Bandit, Bureaucrat, Library, Militia, Witch } from "shared/cards/base";
import { Curse } from "shared/cards/curses";
import { Copper, Gold, Silver } from "shared/cards/treasures";
import {
  BinaryDescriptions,
  GainDescriptions,
  PickCardsDescriptions,
} from "shared/messages";
import { shuffle } from "shared/shuffle";
import type { supplyStack } from "shared/supply";
import type { Game, NonBlockingCc } from "./game";

export const effect_table: Record<CardName, (game: Game) => void> = {
  Copper: (game: Game) => {
    game.game_state.money += 1;
  },
  Silver: (game: Game) => {
    game.game_state.money += 2;
    // Handle Silver's interaction with Merchant card
    if (
      !game.game_state.played_cards.some((card) => card.info.name === "Silver")
    ) {
      const played = game.game_state.played_cards;
      const num_merchants = played.filter(
        (card) => card.info.name === "Merchant",
      ).length;
      game.game_state.money += num_merchants;
    }
  },
  Gold: (game: Game) => {
    game.game_state.money += 3;
  },
  Estate: () => {},
  Duchy: () => {},
  Province: () => {},
  Gardens: () => {},
  Curse: () => {},
  Cellar: (game: Game) => {
    const player = game.get_current_player();
    game.game_state.actions += 1;
    game.prompt_pick_card(
      game.get_current_player_info(),
      PickCardsDescriptions.DISCARD_ANY,
      player.hand,
      0,
      player.hand.length,
      get_next(),
    );

    function get_next(): (choices: Card[]) => void {
      return (choices: Card[]) => {
        for (const card of choices) {
          game.discard_card(
            player,
            player.hand.findIndex((c) => c.id === card.id),
            player.hand,
          );
        }
        game.draw_cards(player, choices.length);
      };
    }
  },
  Chapel: (game: Game) => {
    const player = game.get_current_player();
    game.prompt_pick_card(
      game.get_current_player_info(),
      PickCardsDescriptions.TRASH_ANY,
      player.hand,
      0,
      Math.min(player.hand.length, 4),
      get_next(),
    );

    function get_next(): (choices: Card[]) => void {
      return (choices: Card[]) => {
        for (const card of choices) {
          game.trash_card(
            player,
            player.hand.findIndex((c) => c.id === card.id),
            player.hand,
          );
        }
      };
    }
  },
  Moat: (game: Game) => {
    game.draw_cards(game.get_current_player(), 2);
  },
  Harbinger: (game: Game) => {
    const player = game.get_current_player();
    game.draw_cards(player, 1);
    game.game_state.actions += 1;
    if (player.discard_pile.length > 0) {
      game.prompt_pick_card(
        game.get_current_player_info(),
        PickCardsDescriptions.PUT_ON_DECK,
        player.discard_pile,
        0,
        1,
        get_next(),
      );
    }

    function get_next(): (choices: Card[]) => void {
      return (choices: Card[]) => {
        if (choices.length > 0) {
          const card = choices[0]!;
          player.deck.push(
            game.remove_card(
              player.discard_pile.findIndex((c) => c.id === card.id),
              player.discard_pile,
            ),
          );
        }
      };
    }
  },
  Merchant: (game: Game) => {
    game.draw_cards(game.get_current_player(), 1);
    game.game_state.actions += 1;
    // Merchant effect is handled in the Silver case of the effect table
  },
  Vassal: (game: Game) => {
    const player = game.get_current_player();
    game.game_state.money += 2;
    game.discard_card(player, player.deck.length - 1, player.deck);
    const discarded = player.discard_pile.at(-1);
    if (
      discarded !== undefined &&
      discarded!.info.types.includes(CardTypes.ACTION)
    ) {
      game.prompt_binary_choice(
        game.get_current_player_info(),
        BinaryDescriptions.BINARY_PLAY,
        discarded!,
        get_next(),
      );
    }

    function get_next(): (choice: boolean) => void {
      return (choice: boolean) => {
        if (choice) {
          game.play_card(
            player.discard_pile.findIndex((c) => c.id === discarded!.id),
            player.discard_pile,
          );
        }
      };
    }
  },
  Village: (game: Game) => {
    game.draw_cards(game.get_current_player(), 1);
    game.game_state.actions += 2;
  },
  Workshop: (game: Game) => {
    const player = game.get_current_player();
    game.prompt_gain_card(
      game.get_current_player_info(),
      GainDescriptions.GAIN,
      game.game_state.supply
        .getStacks()
        .filter((stack) => stack.count > 0 && stack.card.cost <= 4),
      1,
      1,
      get_next(),
    );

    function get_next(): (choices: supplyStack[]) => void {
      return (choices: supplyStack[]) => {
        for (const stack of choices) {
          game.gain_card(player, stack.card.name, player.discard_pile);
        }
      };
    }
  },
  Bureaucrat: (game: Game) => {
    const benefit = () => {
      const player = game.get_current_player();
      game.gain_card(player, Silver.name, player.deck);
    };
    const next = () => {
      const player = game.get_player(game.game_state.attack_index!);
      if (
        player.hand.some((card) => card.info.types.includes(CardTypes.VICTORY))
      ) {
        game.prompt_pick_card(
          game.get_player_info(game.get_players().indexOf(player)),
          PickCardsDescriptions.PUT_ON_DECK,
          player.hand.filter((card) =>
            card.info.types.includes(CardTypes.VICTORY),
          ),
          1,
          1,
          get_hinder_next(player),
        );
      }
    };
    game.handle_attack(Bureaucrat.name, benefit, next);

    function get_hinder_next(player: Player): (choices: Card[]) => void {
      return (choices: Card[]) => {
        for (const card of choices) {
          game.remove_card(
            player.hand.findIndex((c) => c.id === card.id),
            player.hand,
          );
          player.deck.push(card);
        }
      };
    }
  },
  Militia: (game: Game) => {
    const benefit = () => {
      game.game_state.money += 2;
    };
    const next = () => {
      const player = game.get_player(game.game_state.attack_index!);
      if (player.hand.length > 3) {
        game.prompt_pick_card(
          game.get_player_info(game.get_players().indexOf(player)),
          PickCardsDescriptions.DISCARD_ANY,
          player.hand,
          player.hand.length - 3,
          player.hand.length - 3,
          get_hinder_next(player),
        );
      }
    };
    game.handle_attack(Militia.name, benefit, next);

    function get_hinder_next(player: Player): (choices: Card[]) => void {
      return (choices: Card[]) => {
        for (const card of choices) {
          game.discard_card(
            player,
            player.hand.findIndex((c) => c.id === card.id),
            player.hand,
          );
        }
      };
    }
  },
  Moneylender: (game: Game) => {
    const player = game.get_current_player();
    const copper = player.hand.find((card) => card.info.name === "Copper");
    if (copper) {
      game.prompt_pick_card(
        game.get_current_player_info(),
        PickCardsDescriptions.TRASH_ANY,
        [copper],
        0,
        1,
        get_next(),
      );
    }

    function get_next(): (choices: Card[]) => void {
      return (choices: Card[]) => {
        for (const card of choices) {
          game.trash_card(
            player,
            player.hand.findIndex((c) => c.id === card.id),
            player.hand,
          );
          game.game_state.money += 3;
        }
      };
    }
  },
  Poacher: (game: Game) => {
    const player = game.get_current_player();
    game.draw_cards(player, 1);
    game.game_state.money += 1;
    game.game_state.actions += 1;
    const empty_piles = game.game_state.supply
      .getStacks()
      .filter((stack) => stack.count === 0).length;
    if (empty_piles > 0) {
      game.prompt_pick_card(
        game.get_current_player_info(),
        PickCardsDescriptions.DISCARD_ANY,
        player.hand,
        Math.min(player.hand.length, empty_piles),
        Math.min(player.hand.length, empty_piles),
        get_next(),
      );
    }

    function get_next(): (choices: Card[]) => void {
      return (choices: Card[]) => {
        for (const card of choices) {
          game.discard_card(
            player,
            player.hand.findIndex((c) => c.id === card.id),
            player.hand,
          );
        }
      };
    }
  },
  Remodel: (game: Game) => {
    const player = game.get_current_player();
    if (player.hand.length > 0) {
      game.prompt_pick_card(
        game.get_current_player_info(),
        PickCardsDescriptions.TRASH_ANY,
        player.hand,
        1,
        1,
        get_trash_next(),
      );
    }

    function get_trash_next(): (choices: Card[]) => void {
      return (choices: Card[]) => {
        let value = -1;
        for (const card of choices) {
          value = card!.info.cost + 2;
          game.trash_card(
            player,
            player.hand.findIndex((c) => c.id === card.id),
            player.hand,
          );
        }
        if (value !== -1) {
          game.prompt_gain_card(
            game.get_current_player_info(),
            GainDescriptions.GAIN,
            game.game_state.supply
              .getStacks()
              .filter((stack) => stack.count > 0 && stack.card.cost <= value),
            1,
            1,
            get_gain_next(),
          );
        }
      };
    }

    function get_gain_next(): (choices: supplyStack[]) => void {
      return (choices: supplyStack[]) => {
        for (const stack of choices) {
          game.gain_card(player, stack.card.name, player.discard_pile);
        }
      };
    }
  },
  Smithy: (game: Game) => {
    game.draw_cards(game.get_current_player(), 3);
  },
  "Throne Room": (game: Game) => {
    const player = game.get_current_player();
    game.prompt_pick_card(
      game.get_current_player_info(),
      PickCardsDescriptions.PLAY,
      player.hand.filter((card) => card.info.types.includes(CardTypes.ACTION)),
      0,
      1,
      get_next(),
    );

    function get_next(): (choices: Card[]) => void {
      return (choices: Card[]) => {
        if (choices.length > 0) {
          const card = choices[0]!;
          const second_play_cc: NonBlockingCc = {
            wait: false,
            cc: () => {
              game.send_update();
              effect_table[card.info.name](game);
            },
          };
          game.wait_queue.push_front(second_play_cc);
          game.play_card(
            player.hand.findIndex((c) => c.id === card.id),
            player.hand,
          );
          if (game.wait_queue.peek_front() === second_play_cc) {
            game.wait_queue.pop_front();
            effect_table[card.info.name](game);
          }
        }
      };
    }
  },
  Bandit: (game: Game) => {
    const benefit = () => {
      const player = game.get_current_player();
      game.gain_card(player, Gold.name, player.discard_pile);
    };
    const next = () => {
      const player = game.get_player(game.game_state.attack_index!);
      game.discard_card(player, player.deck.length - 1, player.deck);
      game.discard_card(player, player.deck.length - 1, player.deck);
      const discarded = player.discard_pile.slice(-2);
      if (
        discarded.some(
          (card) =>
            card.info.types.includes(CardTypes.TREASURE) &&
            card.info.name !== Copper.name,
        )
      ) {
        game.prompt_pick_card(
          game.get_player_info(game.get_players().indexOf(player)),
          PickCardsDescriptions.TRASH_ANY,
          discarded.filter(
            (card) =>
              card.info.types.includes(CardTypes.TREASURE) &&
              card.info.name !== Copper.name,
          ),
          1,
          1,
          get_hinder_next(player),
        );
      }
    };
    game.handle_attack(Bandit.name, benefit, next);

    function get_hinder_next(player: Player): (choices: Card[]) => void {
      return (choices: Card[]) => {
        for (const card of choices) {
          game.trash_card(
            player,
            player.discard_pile.findIndex((c) => c.id === card.id),
            player.discard_pile,
          );
        }
      };
    }
  },
  "Council Room": (game: Game) => {
    game.draw_cards(game.get_current_player(), 4);
    game.game_state.buys += 1;
    for (const player of game.get_players_by_turn_order()) {
      if (player !== game.get_current_player()) {
        game.draw_cards(player, 1);
      }
    }
  },
  Festival: (game: Game) => {
    game.game_state.actions += 2;
    game.game_state.buys += 1;
    game.game_state.money += 2;
  },
  Laboratory: (game: Game) => {
    game.draw_cards(game.get_current_player(), 2);
    game.game_state.actions += 1;
  },
  Library: (game: Game) => {
    const player = game.get_current_player();
    game.draw_cards(player, 1);
    const drawn_card = player.hand[player.hand.length - 1]!;
    if (drawn_card.info.types.includes(CardTypes.ACTION)) {
      game.prompt_binary_choice(
        game.get_current_player_info(),
        BinaryDescriptions.BINARY_PUT_IN_HAND,
        drawn_card,
        get_next(),
      );
    } else if (
      player.hand.length < 7 &&
      player.deck.length + player.discard_pile.length > 0
    ) {
      effect_table[Library.name](game);
    }

    function get_next(): (choice: boolean) => void {
      return (choice: boolean) => {
        if (!choice) {
          game.discard_card(player, player.hand.length - 1, player.hand);
        }
        if (
          player.hand.length < 7 &&
          player.deck.length + player.discard_pile.length > 0
        ) {
          effect_table[Library.name](game);
        }
      };
    }
  },
  Market: (game: Game) => {
    game.draw_cards(game.get_current_player(), 1);
    game.game_state.actions += 1;
    game.game_state.buys += 1;
    game.game_state.money += 1;
  },
  Mine: (game: Game) => {
    const player = game.get_current_player();
    if (
      player.hand.some((card) => card.info.types.includes(CardTypes.TREASURE))
    ) {
      game.prompt_pick_card(
        game.get_current_player_info(),
        PickCardsDescriptions.TRASH_ANY,
        player.hand.filter((card) =>
          card.info.types.includes(CardTypes.TREASURE),
        ),
        0,
        1,
        get_trash_next(),
      );
    }

    function get_trash_next(): (choices: Card[]) => void {
      return (choices: Card[]) => {
        if (choices.length > 0) {
          const trashed_cost = choices[0]!.info.cost;
          game.trash_card(
            player,
            player.hand.findIndex((c) => c.id === choices[0]!.id),
            player.hand,
          );
          game.prompt_gain_card(
            game.get_current_player_info(),
            GainDescriptions.GAIN,
            game.game_state.supply
              .getStacks()
              .filter(
                (stack) =>
                  stack.count > 0 &&
                  stack.card.types.includes(CardTypes.TREASURE) &&
                  stack.card.cost <= trashed_cost + 3,
              ),
            1,
            1,
            get_gain_next(),
          );
        }
      };
    }

    function get_gain_next(): (choices: supplyStack[]) => void {
      return (choices: supplyStack[]) => {
        if (choices.length > 0) {
          game.gain_card(player, choices[0]!.card.name, player.hand);
        }
      };
    }
  },
  Sentry: (game: Game) => {
    game.draw_cards(game.get_current_player(), 1);
    game.game_state.actions += 1;
    const player = game.get_current_player();
    const top_cards: Card[] = [];
    for (let i = 0; i < 2; i++) {
      if (player.deck.length === 0 && player.discard_pile.length > 0) {
        player.deck = shuffle(player.discard_pile);
        player.discard_pile = [];
      }
      if (player.deck.length > 0) {
        top_cards.push(player.deck.pop()!);
      }
    }
    if (top_cards.length > 0) {
      game.prompt_pick_card(
        game.get_current_player_info(),
        PickCardsDescriptions.TRASH_ANY,
        top_cards,
        0,
        top_cards.length,
        get_trash_next(),
      );
    }

    function get_trash_next(): (choices: Card[]) => void {
      return (choices: Card[]) => {
        let remaining_cards = top_cards;
        for (const card of choices) {
          game.trash_card(
            player,
            top_cards.findIndex((c) => c.id === card.id),
            top_cards,
          );
          remaining_cards = remaining_cards.filter((c) => c.id !== card.id);
        }
        if (remaining_cards.length > 0) {
          game.prompt_pick_card(
            game.get_current_player_info(),
            PickCardsDescriptions.DISCARD_ANY,
            remaining_cards,
            0,
            remaining_cards.length,
            get_discard_next(remaining_cards),
          );
        }
      };
    }

    function get_discard_next(
      remaining_cards: Card[],
    ): (choices: Card[]) => void {
      return (choices: Card[]) => {
        let final_cards = remaining_cards;
        for (const card of choices) {
          game.discard_card(
            player,
            remaining_cards.findIndex((c) => c.id === card.id),
            remaining_cards,
          );
          final_cards = final_cards.filter((c) => c.id !== card.id);
        }
        if (final_cards.length === 2) {
          game.prompt_pick_card(
            game.get_current_player_info(),
            PickCardsDescriptions.PUT_ON_DECK,
            final_cards,
            1,
            1,
            get_put_back_next(final_cards),
          );
        } else if (final_cards.length === 1) {
          player.deck.push(final_cards[0]!);
        }
      };
    }

    function get_put_back_next(final_cards: Card[]): (choices: Card[]) => void {
      return (choices: Card[]) => {
        if (choices.find((c) => c.id === final_cards[0]!.id)) {
          player.deck.push(final_cards[1]!);
          player.deck.push(final_cards[0]!);
        } else {
          player.deck.push(final_cards[0]!);
          player.deck.push(final_cards[1]!);
        }
      };
    }
  },
  Witch: (game: Game) => {
    const benefit = () => {
      const player = game.get_current_player();
      game.draw_cards(player, 2);
    };

    const next = () => {
      const player = game.get_player(game.game_state.attack_index!);
      game.gain_card(player, Curse.name, player.discard_pile);
    };

    game.handle_attack(Witch.name, benefit, next);
  },
  Artisan: (game: Game) => {
    const player = game.get_current_player();
    game.prompt_gain_card(
      game.get_current_player_info(),
      GainDescriptions.GAIN,
      game.game_state.supply
        .getStacks()
        .filter((stack) => stack.count > 0 && stack.card.cost <= 5),
      1,
      1,
      get_gain_next(),
    );

    function get_gain_next(): (choices: supplyStack[]) => void {
      return (choices: supplyStack[]) => {
        if (choices.length > 0) {
          game.gain_card(player, choices[0]!.card.name, player.hand);
        }
        game.prompt_pick_card(
          game.get_current_player_info(),
          PickCardsDescriptions.PUT_ON_DECK,
          player.hand,
          1,
          1,
          get_put_back_next(),
        );
      };
    }

    function get_put_back_next(): (choices: Card[]) => void {
      return (choices: Card[]) => {
        if (choices.length > 0) {
          game.remove_card(
            player.hand.findIndex((c) => c.id === choices[0]!.id),
            player.hand,
          );
          player.deck.push(choices[0]!);
        }
      };
    }
  },
};
