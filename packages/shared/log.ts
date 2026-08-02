export class Log {
  log_messages: Turn[];

  constructor() {
    this.log_messages = [];
  }

  new_turn(turn_number: number, active_player_name: string) {
    this.log_messages.push({
      active_player_name: active_player_name,
      turn_number: turn_number,
      events: [],
    });
  }

  log_events(...events: LogEntry[]) {
    this.log_messages[-1]?.events.push(...events);
  }

  get_curr_turn(): Turn {
    return this.log_messages[-1]!;
  }
}

export type Turn = {
  active_player_name: string;
  turn_number: number;
  events: LogEntry[];
};

export type LogEntry = {
  message: string;
};
