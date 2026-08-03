import { describe, expect, test } from "bun:test";
import { type PlayerInfo, rank_players_at_game_end } from "./game";
import { FakeSink } from "./test-utils";

function make_player_info(name: string, victory_points: number): PlayerInfo {
  return {
    player: { name, hand: [], deck: [], discard_pile: [], victory_points },
    clientid: name,
    socket: new FakeSink(),
  };
}

function names(ranked: ReturnType<typeof rank_players_at_game_end>): string[] {
  return ranked.map((r) => r.player_info.player.name);
}

describe("rank_players_at_game_end", () => {
  test("ranks players purely by victory points when there is no tie", () => {
    const player_infos = [
      make_player_info("A", 10),
      make_player_info("B", 5),
      make_player_info("C", 3),
    ];

    const ranked = rank_players_at_game_end(player_infos, 1);

    expect(names(ranked)).toEqual(["A", "B", "C"]);
    expect(ranked[0]!.index).toBe(0);
  });

  test("when the ending player is tied for first with someone after them in turn order, the player after wins alone", () => {
    // A ends the game tied with B, who hasn't had their turn yet this round.
    const player_infos = [
      make_player_info("A", 10),
      make_player_info("B", 10),
      make_player_info("C", 5),
    ];

    const ranked = rank_players_at_game_end(player_infos, 0);

    expect(names(ranked)).toEqual(["B", "A", "C"]);
    expect(ranked[0]!.index).toBe(1);
    expect(ranked[0]!.turns_tier).toBe(0);
    expect(ranked[1]!.turns_tier).toBe(1);
  });

  test("when the ending player is tied for first with only players before/at them, they share the win", () => {
    // B is the ending player; A (before B) has taken the same number of turns as B.
    const player_infos = [
      make_player_info("A", 10),
      make_player_info("B", 10),
      make_player_info("C", 5),
    ];

    const ranked = rank_players_at_game_end(player_infos, 1);

    expect(ranked[0]!.turns_tier).toBe(1);
    expect(ranked[1]!.turns_tier).toBe(1);
    expect(new Set([ranked[0]!.index, ranked[1]!.index])).toEqual(
      new Set([0, 1]),
    );
  });

  test("resolves a tie that straddles the ending player even when the ending player isn't part of it", () => {
    // A and C are tied for the lead; the ending player (index 1) has a low score
    // and sits between them in turn order. C hasn't had their turn yet this round,
    // so C should win outright rather than sharing the win with A.
    const player_infos = [
      make_player_info("A", 10),
      make_player_info("Ending", 2),
      make_player_info("B", 5),
      make_player_info("C", 10),
    ];

    const ranked = rank_players_at_game_end(player_infos, 1);

    expect(ranked[0]!.player_info.player.name).toBe("C");
    expect(ranked[0]!.turns_tier).toBe(0);
    expect(ranked[1]!.player_info.player.name).toBe("A");
    expect(ranked[1]!.turns_tier).toBe(1);
  });

  test("applies the turns-taken tiebreak at every rank, not just first place", () => {
    const player_infos = [
      make_player_info("A", 10),
      make_player_info("Ending", 5),
      make_player_info("B", 5),
      make_player_info("C", 3),
    ];

    const ranked = rank_players_at_game_end(player_infos, 1);

    expect(names(ranked)).toEqual(["A", "B", "Ending", "C"]);
  });
});
