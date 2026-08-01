import type React from "react";
import type { CardName } from "shared/cards";
import { GoldCoin } from "./Game";

export const card_descriptions: Record<CardName, React.ReactNode> = {
  // Treasure Cards
  Copper: (
    <p>
      +<GoldCoin cost={1} />
    </p>
  ),
  Silver: (
    <p>
      +<GoldCoin cost={2} />
    </p>
  ),
  Gold: (
    <p>
      +<GoldCoin cost={3} />
    </p>
  ),
  // Victory Cards
  Estate: (
    <p>
      <b>1 VP</b>
    </p>
  ),
  Duchy: (
    <p>
      <b>3 VP</b>
    </p>
  ),
  Province: (
    <p>
      <b>6 VP</b>
    </p>
  ),
  Curse: (
    <p>
      <b>-1 VP</b>
    </p>
  ),

  // Action Cards
  Artisan: (
    <>
      <p>
        Gain a card to your hand costing up to <GoldCoin cost={5} />
      </p>
      <p>Put a card from your hand onto your deck</p>
    </>
  ),
  Bandit: (
    <>
      <p>Gain a Gold</p>
      <p>
        Each other player reveals the top 2 cards of their deck, trashes a
        revealed Treasure other than Copper, and discards the rest
      </p>
    </>
  ),
  Bureaucrat: (
    <>
      <p>Gain a Silver onto your deck</p>
      <p>
        Each other player reveals a Victory card from their hand and puts it
        onto their deck (or reveals a hand with no Victory cards)
      </p>
    </>
  ),
  Cellar: (
    <>
      <p>
        <b>+1 Action</b>
      </p>
      <p>Discard any number of cards, then draw that many</p>
    </>
  ),
  Chapel: (
    <>
      <p>Trash up to 4 cards from your hand</p>
    </>
  ),
  "Council Room": (
    <>
      <p>
        <b>+4 Cards</b>
      </p>
      <p>
        <b>+1 Buy</b>
      </p>
      <p>Each other player draws a card</p>
    </>
  ),
  Festival: (
    <>
      <p>
        <b>+2 Actions</b>
      </p>
      <p>
        <b>+1 Buy</b>
      </p>
      <p>
        <b>
          {" "}
          +<GoldCoin cost={2} />
        </b>
      </p>
    </>
  ),
  Gardens: (
    <>
      <p>
        Worth <b>1 VP</b> per 10 cards you have (round down)
      </p>
    </>
  ),
  Harbinger: (
    <>
      <p>
        <b>+1 Action</b>
      </p>
      <p>
        <b>+1 Card</b>
      </p>
      <p>
        Look through your discard pile. You may put a card from it onto your
        deck
      </p>
    </>
  ),
  Laboratory: (
    <>
      <p>
        <b>+1 Action</b>
      </p>
      <p>
        <b>+2 Cards</b>
      </p>
    </>
  ),
  Library: (
    <>
      <p>
        Draw until you have 7 cards in hand, skipping any Action cards you
        choose to; set those aside, discarding them afterwards
      </p>
    </>
  ),
  Market: (
    <>
      <p>
        <b>+1 Action</b>
      </p>
      <p>
        <b>+1 Card</b>
      </p>
      <p>
        <b>+1 Buy</b>
      </p>
      <p>
        <b>
          {" "}
          +<GoldCoin cost={1} />
        </b>
      </p>
    </>
  ),
  Merchant: (
    <>
      <p>
        <b>+1 Action</b>
      </p>
      <p>
        <b>+1 Card</b>
      </p>
      <p>
        The first time you play a Silver this turn, +<GoldCoin cost={1} />
      </p>
    </>
  ),
  Militia: (
    <>
      <p>
        <b>
          +<GoldCoin cost={2} />
        </b>
      </p>
      <p>Each other player discards down to 3 cards in hand</p>
    </>
  ),
  Mine: (
    <>
      <p>You may trash a Treasure from your hand</p>
      <p>
        Gain a Treasure to your hand costing up to <GoldCoin cost={3} /> more
        than it
      </p>
    </>
  ),
  Moat: (
    <>
      <p>
        <b>+2 Cards</b>
      </p>
      <p>
        When another player plays an Attack card, you may first reveal this from
        your hand, to be unaffected by it
      </p>
    </>
  ),
  Moneylender: (
    <>
      <p>
        You may trash a Copper from your hand for{" "}
        <b>
          +<GoldCoin cost={3} />
        </b>
      </p>
    </>
  ),
  Poacher: (
    <>
      <p>
        <b>+1 Action</b>
      </p>
      <p>
        <b>+1 Card</b>
      </p>
      <p>
        <b>
          +<GoldCoin cost={1} />
        </b>
      </p>
      <p>Discard a card per empty Supply pile</p>
    </>
  ),
  Remodel: (
    <>
      <p>Trash a card from your hand</p>
      <p>
        Gain a card costing up to <GoldCoin cost={2} /> more than it
      </p>
    </>
  ),
  Sentry: (
    <>
      <p>
        <b>+1 Action</b>
      </p>
      <p>
        <b>+1 Card</b>
      </p>
      <p>Look at the top 2 cards of your deck</p>
      <p>
        Trash and/or discard any number of them. Put the rest back on top in any
        order
      </p>
    </>
  ),
  Smithy: (
    <>
      <p>
        <b>+3 Cards</b>
      </p>
    </>
  ),
  "Throne Room": (
    <>
      <p>You may play an Action card from your hand twice</p>
    </>
  ),
  Vassal: (
    <>
      <p>
        <b>
          +<GoldCoin cost={2} />
        </b>
      </p>
      <p>
        Discard the top card of your deck. If it's an Action card, you may play
        it
      </p>
    </>
  ),
  Village: (
    <>
      <p>
        <b>+2 Actions</b>
      </p>
      <p>
        <b>+1 Card</b>
      </p>
    </>
  ),
  Witch: (
    <>
      <p>
        <b>+2 Cards</b>
      </p>
      <p>Each other player gains a Curse</p>
    </>
  ),
  Workshop: (
    <>
      <p>
        Gain a card costing up to <GoldCoin cost={4} />
      </p>
    </>
  ),
};
