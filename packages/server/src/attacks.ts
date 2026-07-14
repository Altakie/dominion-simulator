import { type CardName, CardTypes } from "shared/cards";
import { BinaryDescriptions } from "shared/messages";
import { effect_table } from "./effects";
import type { Game } from "./game";

export function handle_attack(
  game: Game,
  card_name: CardName,
  benefit: () => void,
  next: () => void,
) {
  if (game.game_state.attack_index === null) {
    benefit();
    game.game_state.attack_index =
      (game.game_state.current_player_index + 1) % game.player_infos.length;
    effect_table[card_name](game);
    return;
  } else if (
    game.game_state.attack_index === game.game_state.current_player_index
  ) {
    game.game_state.attack_index = null;
    return;
  }

  const player = game.get_player(game.game_state.attack_index);
  if (
    player.hand.some((card) => card.info.types.includes(CardTypes.REACTION))
  ) {
    // TODO: Should let you pick from any reaction in your hand
    game.prompt_binary_choice(
      game.get_player_info(
        game.player_infos.findIndex((p) => p.player === player)!,
      ),
      BinaryDescriptions.BINARY_REACT,
      player.hand.find((card) => card.info.types.includes(CardTypes.REACTION))!,
      get_wrapped_attack_next(game, card_name, next),
    );
  } else {
    next();
    game.game_state.attack_index =
      (game.game_state.attack_index! + 1) % game.player_infos.length;
    effect_table[card_name](game);
  }
}

function get_wrapped_attack_next(
  game: Game,
  card_name: CardName,
  next: () => void,
): (blocked: boolean) => void {
  return (blocked: boolean) => {
    if (!blocked) {
      next();
    }
    game.game_state.attack_index =
      (game.game_state.attack_index! + 1) % game.player_infos.length;
    (() => effect_table[card_name](game))();
  };
}
