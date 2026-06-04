import { CardTypes, type Card, type CardName } from "shared/cards"
import type { Game } from "./game"
import { Curse } from "shared/cards/curses"
import { BinaryDescriptions, GainDescriptions, PickCardsDescriptions } from "shared/messages"
import type { supplyStack } from "shared/supply"
import { Copper, Gold, Silver } from "shared/cards/treasures"

export const effect_table: Record<CardName, (game: Game) => void> = {
  "Copper": (game: Game) => {
    game.game_state.money += 1
  },
  "Silver": (game: Game) => {
    game.game_state.money += 2
    // Handle Silver's interaction with Merchant card
    if (!game.game_state.played_cards.some(card => card.info.name === "Silver")) {
      let played = game.game_state.played_cards
      let num_merchants = played.filter(card => card.info.name === "Merchant").length
      game.game_state.money += num_merchants
    }
  },
  "Gold": (game: Game) => {
    game.game_state.money += 3
  },
  "Estate": (game: Game) => {
    game.get_current_player().victory_points += 1
  },
  "Duchy": (game: Game) => {
    game.get_current_player().victory_points += 3
  },
  "Province": (game: Game) => {
    game.get_current_player().victory_points += 6
  },
  "Gardens": (game: Game) => {
    let player = game.get_current_player()
    player.victory_points +=
      Math.floor((player.deck.length +
        player.discard_pile.length +
        player.hand.length) / 10)
  },
  "Curse": (game: Game) => {
    game.get_current_player().victory_points -= 1
  },
  "Cellar": (game: Game) => {
    let player = game.get_current_player()
    const next = (choices: Card[]) => {
      for (let card of choices) {
        game.discard_card(
          player,
          player.hand.indexOf(card),
          player.discard_pile
        )
      }
      game.draw_cards(player, choices.length)
    }
    game.game_state.actions += 1
    game.prompt_pick_card(
      game.get_current_player_info(),
      PickCardsDescriptions.DISCARD_ANY,
      player.hand,
      0,
      player.hand.length,
      next
    )
  },
  "Chapel": (game: Game) => {
    let player = game.get_current_player()
    const next = (choices: Card[]) => {
      for (let card of choices) {
        game.trash_card(
          player.hand.indexOf(card),
          player.hand
        )
      }
    }
    game.prompt_pick_card(
      game.get_current_player_info(),
      PickCardsDescriptions.TRASH_ANY,
      player.hand,
      0,
      Math.max(player.hand.length, 4),
      next
    )
  },
  "Moat": (game: Game) => {
    game.draw_cards(game.get_current_player(), 2)
  },
  "Harbinger": (game: Game) => {
    let player = game.get_current_player()
    game.draw_cards(player, 1)
    game.game_state.actions += 1
    const next = (choices: Card[]) => {
      if (choices.length > 0) {
        let card = choices[0]
        game.remove_card(player.discard_pile.indexOf(card!), player.discard_pile)
        player.deck.push(card!)
      }
    }
    game.prompt_pick_card(
      game.get_current_player_info(),
      PickCardsDescriptions.PUT_ON_DECK,
      player.discard_pile,
      0,
      1,
      next
    )
  },
  "Merchant": (game: Game) => {
    game.draw_cards(game.get_current_player(), 1)
    game.game_state.actions += 1
    // Merchant effect is handled in the Silver case of the effect table
  },
  "Vassal": (game: Game) => {
    let player = game.get_current_player()
    game.game_state.money += 2
    game.discard_card(player, player.deck.length - 1, player.deck)
    let discarded = player.discard_pile.at(-1)
    if (discarded!.info.types.includes(CardTypes.ACTION)) {
      const next = (choice: boolean) => {
        if (choice) {
          game.play_card(player.discard_pile.indexOf(discarded!), player.discard_pile)
        }
      }
      game.prompt_binary_choice(
        game.get_current_player_info(),
        BinaryDescriptions.BINARY_PLAY,
        discarded!,
        next
      )
    }
  },
  "Village": (game: Game) => {
    game.draw_cards(game.get_current_player(), 1)
    game.game_state.actions += 2
  },
  "Workshop": (game: Game) => {
    let player = game.get_current_player()
    const next = (choices: supplyStack[]) => {
      for (let stack of choices) {
        game.gain_card(stack.card.name, player.discard_pile)
      }
    }
    game.prompt_gain_card(
      game.get_current_player_info(),
      GainDescriptions.GAIN,
      game.game_state.supply.getStacks().filter(stack => stack.count > 0 && stack.card.cost <= 4),
      1,
      1,
      next
    )
  },
  "Bureaucrat": (game: Game) => {
    let curr_player = game.get_current_player()
    game.gain_card(Silver.name, curr_player.deck)
    for (let player of game.get_players_by_turn_order()) {
      if (player !== game.get_current_player()) {
        let victory_cards = player.hand.filter(card => card.info.types.includes(CardTypes.VICTORY))
        if (victory_cards.length > 0) {
          const next = (choices: Card[]) => {
            for (let card of choices) {
              game.remove_card(player.hand.indexOf(card!), player.hand)
              player.deck.push(card!)
            }
          }
          game.prompt_pick_card(
            game.get_player_info(game.get_players().indexOf(player)),
            PickCardsDescriptions.PUT_ON_DECK,
            victory_cards,
            1,
            1,
            next
          )
        }
      }
    }
  },
  "Militia": (game: Game) => {
    game.game_state.money += 2
    for (let player of game.get_players_by_turn_order()) {
      if (player !== game.get_current_player()) {
        const next = (choices: Card[]) => {
          for (let card of choices) {
            game.discard_card(
              player,
              player.hand.indexOf(card),
              player.hand
            )
          }
        }
        if (player.hand.length > 3) {
          game.prompt_pick_card(
            game.get_player_info(game.get_players().indexOf(player)),
            PickCardsDescriptions.DISCARD_ANY,
            player.hand,
            Math.max(0, player.hand.length - 3),
            Math.max(0, player.hand.length - 3),
            next
          )
        }
      }
    }
  },
  "Moneylender": (game: Game) => {
    let player = game.get_current_player()
    let copper = player.hand.find(card => card.info.name === "Copper")
    if (copper) {
      const next = (choices: Card[]) => {
        for (let card of choices) {
          game.trash_card(
            player.hand.indexOf(card!),
            player.hand
          )
          game.game_state.money += 3
        }
      }
      game.prompt_pick_card(
        game.get_current_player_info(),
        PickCardsDescriptions.TRASH_ANY,
        [copper],
        0,
        1,
        next
      )
    }
  },
  "Poacher": (game: Game) => {
    let player = game.get_current_player()
    game.draw_cards(player, 1)
    game.game_state.money += 1
    game.game_state.actions += 1
    let empty_piles = game.game_state.supply.getStacks().filter(stack => stack.count === 0).length
    if (empty_piles > 0) {
      const next = (choices: Card[]) => {
        for (let card of choices) {
          game.discard_card(
            player,
            player.hand.indexOf(card!),
            player.hand
          )
        }
      }
      game.prompt_pick_card(
        game.get_current_player_info(),
        PickCardsDescriptions.DISCARD_ANY,
        player.hand,
        Math.min(player.hand.length, empty_piles),
        Math.min(player.hand.length, empty_piles),
        next
      )
    }
  },
  "Remodel": (game: Game) => {
    let player = game.get_current_player()
    const trash_next = (choices: Card[]) => {
      let value = -1
      for (let card of choices) {
        value = card!.info.cost + 2
        game.trash_card(
          player.hand.indexOf(card!),
          player.hand
        )
      }
      if (value !== -1) {
        const gain_next = (choices: supplyStack[]) => {
          for (let stack of choices) {
            game.gain_card(stack.card.name, player.discard_pile)
          }
        }
        game.prompt_gain_card(
          game.get_current_player_info(),
          GainDescriptions.GAIN,
          game.game_state.supply.getStacks().filter(
            stack => stack.count > 0 && stack.card.cost <= value
          ),
          1,
          1,
          gain_next
        )
      }
    }
    if (player.hand.length > 0) {
      game.prompt_pick_card(
        game.get_current_player_info(),
        PickCardsDescriptions.TRASH_ANY,
        player.hand,
        1,
        1,
        trash_next
      )
    }
  },
  "Smithy": (game: Game) => {
    game.draw_cards(game.get_current_player(), 3)
  },
  "Throne Room": (game: Game) => {
    let player = game.get_current_player()
    const next = (choices: Card[]) => {
      if (choices.length > 0) {
        let card = choices[0]
        game.play_card(player.hand.indexOf(card!), player.hand)
        player.hand.push(game.remove_card(
          game.game_state.played_cards.indexOf(card!),
          game.game_state.played_cards
        ))
        game.play_card(player.hand.indexOf(card!), player.hand)
      }
    }
    game.prompt_pick_card(
      game.get_current_player_info(),
      PickCardsDescriptions.PLAY,
      player.hand.filter(card => card.info.types.includes(CardTypes.ACTION)),
      0,
      1,
      next
    )
  },
  "Bandit": (game: Game) => {
    game.gain_card(Gold.name, game.get_current_player().discard_pile)
    for (let player of game.get_players_by_turn_order()) {
      if (player !== game.get_current_player()) {
        game.discard_card(
          player,
          player.deck.length - 1,
          player.deck
        )
        game.discard_card(
          player,
          player.deck.length - 1,
          player.deck
        )
        let treasures = player.discard_pile.slice(-2).filter(
          card => card.info.types.includes(CardTypes.TREASURE)
          && card.info.name !== Copper.name
        )
        if (treasures.length > 0) {
          const next = (choices: Card[]) => {
            for (let card of choices) {
              game.trash_card(
                player.discard_pile.indexOf(card!),
                player.discard_pile
              )
            }
          }
          game.prompt_pick_card(
            game.get_player_info(game.get_players().indexOf(player)),
            PickCardsDescriptions.TRASH_ANY,
            treasures,
            1,
            1,
            next
          )
        }
      }
    }
  },
  "Council Room": (game: Game) => {
    game.draw_cards(game.get_current_player(), 4)
    game.game_state.buys += 1
    for (let player of game.get_players_by_turn_order()) {
      if (player !== game.get_current_player()) {
        game.draw_cards(player, 1)
      }
    }
  },
  "Festival": (game: Game) => {
    game.game_state.actions += 2
    game.game_state.buys += 1
    game.game_state.money += 2
  },
  "Laboratory": (game: Game) => {
    game.draw_cards(game.get_current_player(), 2)
    game.game_state.actions += 1
  },
  "Library": (game: Game) => {
    let player = game.get_current_player()
    while (player.hand.length < 7 && player.deck.length + player.discard_pile.length > 0) {
      game.draw_cards(player, 1)
      let drawn_card = player.hand[player.hand.length - 1]!
      if (drawn_card.info.types.includes(CardTypes.ACTION)) {
        const next = (choice: boolean) => {
          if (!choice) {
            game.discard_card(
              player,
              player.hand.length - 1,
              player.hand
            )
          }
        }
        game.prompt_binary_choice(
          game.get_current_player_info(),
          BinaryDescriptions.BINARY_PUT_IN_HAND,
          drawn_card,
          next
        )
      }
    }
  },
  "Market": (game: Game) => {
    game.draw_cards(game.get_current_player(), 1)
    game.game_state.actions += 1
    game.game_state.buys += 1
    game.game_state.money += 1
  },
  "Mine": (game: Game) => {
    let player = game.get_current_player()
    const trash_next = (choices: Card[]) => {
      if (choices.length > 0) {
        let trashed_cost = choices[0]!.info.cost
        game.trash_card(
          player.hand.indexOf(choices[0]!),
          player.hand
        )
        const gain_next = (choices: supplyStack[]) => {
          if (choices.length > 0) {
            game.gain_card(
              choices[0]!.card.name,
              player.hand
            )
          }
        }
        game.prompt_gain_card(
          game.get_current_player_info(),
          GainDescriptions.GAIN,
          game.game_state.supply.getStacks().filter(
            stack => stack.count > 0 &&
              stack.card.types.includes(CardTypes.TREASURE) &&
              stack.card.cost <= trashed_cost + 3
          ),
          1,
          1,
          gain_next
        )
      }
    }
    if (player.hand.some(card => card.info.types.includes(CardTypes.TREASURE))) {
      game.prompt_pick_card(
        game.get_current_player_info(),
        PickCardsDescriptions.TRASH_ANY,
        player.hand.filter(card => card.info.types.includes(CardTypes.TREASURE)),
        0,
        1,
        trash_next
      )
    }
  },
  "Sentry": (game: Game) => {
    game.draw_cards(game.get_current_player(), 1)
    game.game_state.actions += 1
    let player = game.get_current_player()
    game.draw_cards(player, 2)
    let top_cards = player.hand.slice(-2)
    if (top_cards.length > 0) {
      const trash_next = (choices: Card[]) => {
        for (let card of choices) {
          game.trash_card(player.hand.indexOf(card!), player.hand)
        }
        let remaining_cards = top_cards.filter(card => !choices.includes(card!))
        if (remaining_cards.length > 0) {
          const discard_next = (choices: Card[]) => {
            for (let card of choices) {
              game.discard_card(player, player.hand.indexOf(card!), player.hand)
            }
            let final_cards = remaining_cards.filter(card => !choices.includes(card!))
            if (final_cards.length == 2) {
              const put_back_next = (choices: Card[]) => {
                if (choices.includes(final_cards[0]!)) {
                  game.remove_card(player.hand.indexOf(final_cards[0]!), player.hand)
                  player.deck.push(final_cards[0]!)
                } else {
                  game.remove_card(player.hand.indexOf(final_cards[1]!), player.hand)
                  player.deck.push(final_cards[1]!)
                }
              }
              game.prompt_pick_card(
                game.get_current_player_info(),
                PickCardsDescriptions.PUT_ON_DECK,
                final_cards,
                1,
                1,
                put_back_next
              )
            } else if (final_cards.length == 1) {
              game.remove_card(player.hand.indexOf(final_cards[0]!), player.hand)
              player.deck.push(final_cards[0]!)
            }
          }
          game.prompt_pick_card(
            game.get_current_player_info(),
            PickCardsDescriptions.DISCARD_ANY,
            remaining_cards,
            0,
            remaining_cards.length,
            discard_next
          )
        }
      }
      game.prompt_pick_card(
        game.get_current_player_info(),
        PickCardsDescriptions.TRASH_ANY,
        top_cards,
        0,
        top_cards.length,
        trash_next
      )
    }
  },
  "Witch": (game: Game) => {
    game.draw_cards(game.get_current_player(), 2)
    for (let player of game.get_players_by_turn_order()) {
      if (player !== game.get_current_player()) {
        game.gain_card(Curse.name, player.discard_pile)
      }
    }
  },
  "Artisan": (game: Game) => {
    let player = game.get_current_player()
    const gain_next = (choices: supplyStack[]) => {
      if (choices.length > 0) {
        game.gain_card(choices[0]!.card.name, player.hand)
      }
      const put_back_next = (choices: Card[]) => {
        if (choices.length > 0) {
          game.remove_card(player.hand.indexOf(choices[0]!), player.hand)
          player.deck.push(choices[0]!)
        }
      }
      game.prompt_pick_card(
        game.get_current_player_info(),
        PickCardsDescriptions.PUT_ON_DECK,
        player.hand,
        1,
        1,
        put_back_next
      )
    }
    game.prompt_gain_card(
      game.get_current_player_info(),
      GainDescriptions.GAIN,
      game.game_state.supply.getStacks().filter(
        stack => stack.count > 0
        && stack.card.cost <= 5
      ),
      1,
      1,
      gain_next
    )
  }
}

