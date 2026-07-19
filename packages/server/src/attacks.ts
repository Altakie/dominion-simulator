import { CardTypes } from "shared/cards";
import { PickCardsDescriptions } from "shared/effect_descriptions";
import type { Game } from "./game";

export type AttackCC = (game: Game, next: () => void) => void;

export function next_attack(game: Game, attack: AttackCC) {
  if (game.game_state.attack_index === null) {
    game.game_state.attack_index =
      (game.game_state.current_player_index + 1) % game.player_infos.length;
  } else {
    game.game_state.attack_index += 1;
    game.game_state.attack_index %= game.player_infos.length;
  }
  if (game.game_state.attack_index === game.game_state.current_player_index) {
    game.game_state.attack_index = null;
    return;
  }

  const attacked_player_info =
    game.player_infos[game.game_state.attack_index!]!;
  const reactions = attacked_player_info.player.hand.filter((c) =>
    c.info.types.some((t) => t === CardTypes.REACTION),
  );

  if (reactions?.length > 0) {
    game.prompt_pick_card(
      attacked_player_info,
      PickCardsDescriptions.REACT,
      reactions,
      0,
      1,
      (choices) => {
        if (choices.length === 0) {
          attack(game, () => next_attack(game, attack));
        } else {
          game.send_log_message(
            `${attacked_player_info.player.name} revealed ${choices[0]?.info.name} in response to attack`,
          );
          next_attack(game, attack);
        }
      },
    );
  } else {
    attack(game, () => next_attack(game, attack));
  }
}
