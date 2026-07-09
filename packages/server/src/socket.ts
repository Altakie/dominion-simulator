import { GoogleGenAI, ServiceTier } from "@google/genai";
import { randomUUIDv7 } from "bun";
import type { GameState, SharablePlayer } from "shared";
import {
  type GameStateUpdateMessage,
  type Message,
  MessageKinds,
  type PickCardsRequest,
  type PickCardsResponse,
  type PickSupplyPileRequest,
  type PickSupplyPileResponse,
  type PickYesNoResponse,
  parseMessage,
  type StartedMessage,
  serializeMessage,
} from "shared/messages";

export interface MessageSink {
  send: (message: string) => void;
}

const system_instruction =
  "You are a player in a virtual version of the board game dominion." +
  "You will be prompted to make choices based on a game state and your player information." +
  "If you are given a choice between yes and no, return a boolean with true meaning yes and false meaning no." +
  "If you are prompted to pick from a list of cards or a list of supply piles, return the indicies of the choices you want to pick in a list." +
  "When given a list of choices, you should always pick at least the minimum number of choices designated in the message," +
  " and at most the maximum, or your choice will be rejected." +
  "When given a list of choices, if the minimum number of choices is 0, you can return an empty list to skip that choice." +
  "Doing this in the action phase will skip your remaining actions and proceed you to the money phase, and doing this in the buy phase will end your turn." +
  "You will not be prompted to play cards in the money phase, the game engine will automatically play all your treasures." +
  "Certain cards may ask you to make follow up decisions when played, for which you will be reprompted." +
  "You may only pick each choice once." +
  "You should also attach your reason for making a decision to the response, but be succinct when describing your reasoning.";

export class AISocket implements MessageSink {
  client_id: string;
  on_response: (clientid: string, message: Message) => void;
  game_state?: GameState;
  player?: SharablePlayer;
  ai: GoogleGenAI;
  previous_interaction_id?: string;

  constructor(on_response: (clientid: string, message: Message) => void) {
    this.client_id = randomUUIDv7();
    this.on_response = on_response;
    this.ai = new GoogleGenAI({});
  }

  send(msg: string) {
    const message = parseMessage(msg);
    if (message === undefined) {
      return;
    }
    switch (message.kind) {
      case MessageKinds.STARTED: {
        const started_message = message as StartedMessage;
        this.game_state = started_message.state;
        this.player = started_message.player;
        return;
      }
      case MessageKinds.GAME_STATE_UPDATE: {
        const update_msg = message as GameStateUpdateMessage;
        this.game_state = update_msg.game_state;
        this.player = update_msg.player;
        return;
      }
      case MessageKinds.PICK_CARDS_REQUEST:
      case MessageKinds.PICK_SUPPLY_PILE_REQUEST:
      case MessageKinds.PICK_YES_NO_REQUEST:
        break;
      case MessageKinds.GAME_END:
        // Restart the convo
        this.previous_interaction_id = undefined;
        return;
      default:
        return;
    }
    this.handle_request(message, msg);
  }

  async handle_request(message: Message, message_string: string) {
    // TODO: If out of tokens just pick a random choice lol

    let response_format: {};

    if (message.kind === MessageKinds.PICK_YES_NO_REQUEST) {
      response_format = {
        type: "object",
        properties: {
          choice: {
            type: "boolean",
          },
          reasoning: {
            type: "string",
          },
        },
        propertyOrdering: ["choice", "reasoning"],
        required: ["choice", "reasoning"],
      };
    } else {
      response_format = {
        type: "object",
        properties: {
          choice_indicies: {
            type: "array",
            items: {
              type: "number",
            },
          },
          reasoning: {
            type: "string",
          },
        },
        propertyOrdering: ["choice_indicies", "reasoning"],
        required: ["choice_indicies", "reasoning"],
      };
    }

    // TODO:
    // Build interactions object based on request type
    // If its a boolean request, then we ask for a boolean response with some reasoning
    // If its a different kind of request, we ask it to pick a choice
    const interaction = await this.ai.interactions.create({
      model: "gemini-3.1-flash-lite",
      input: message_string,
      system_instruction: system_instruction,
      previous_interaction_id: this.previous_interaction_id,
      response_format: response_format,
    });

    this.previous_interaction_id = interaction.previous_interaction_id;
    const res = JSON.parse(interaction.output_text!);
    console.log(
      `AI Response (${interaction.usage?.total_tokens} tokens used): ${interaction.output_text}`,
    );

    // TODO: Use the choice indicies to figure out which choices were picked
    switch (message.kind) {
      case MessageKinds.PICK_YES_NO_REQUEST: {
        const bool_response: PickYesNoResponse = {
          kind: MessageKinds.PICK_YES_NO_RESPONSE,
          choice: res.choice,
        };
        this.on_response(this.client_id, bool_response);
        break;
      }
      case MessageKinds.PICK_SUPPLY_PILE_REQUEST: {
        const pick_supply_req = message as PickSupplyPileRequest;
        const choices = res.choice_indicies.map(
          (choice_index: number) =>
            pick_supply_req.choices[
              choice_index % pick_supply_req.choices.length
            ]!,
        );
        const pick_supply_res: PickSupplyPileResponse = {
          kind: MessageKinds.PICK_SUPPLY_PILE_RESPONSE,
          choices: choices,
        };
        console.log(`Ai will send ${serializeMessage(pick_supply_res)}`);
        this.on_response(this.client_id, pick_supply_res);
        break;
      }
      case MessageKinds.PICK_CARDS_REQUEST: {
        const pick_cards_req = message as PickCardsRequest;

        const choices = res.choice_indicies.map(
          (choice_index: number) =>
            pick_cards_req.choices[
              choice_index % pick_cards_req.choices.length
            ]!,
        );

        const pick_cards_res: PickCardsResponse = {
          kind: MessageKinds.PICK_CARDS_RESPONSE,
          choices: choices,
        };
        this.on_response(this.client_id, pick_cards_res);
        break;
      }
    }
  }
  // Deserialize the response into an actual message type
  // Send it to the AI
  // Wait for the response
  // Call the game again if the message type requires a reponse
  // TODO: What should the AI do
  // If the message is a request, the ai should send the choices it is making (either a yes or a no or a list of choices)
  // It should adhere to the max and min, if it sends more than the max or less than the min, we should reprompt it or maybe trim the response
  // It should also be a choice from the array, we can enforce this by making it return the indicies of the choices it wants
  // If the message is a game_state update or a log message we need to think
  // Do we even want to send this information to the AI, might cost extra tokens
  // If its a game_state update we should defintely save the game state so we can send it to the ai when prompting it
  // Don't need to send log messages
}
