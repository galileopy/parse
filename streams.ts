import xs, { Stream } from "xstream";
import { createInterface } from "readline";
import { ParseEvent, UserInputEvent }from './events'

// Event stream
export const event$: Stream<ParseEvent> = xs.create<ParseEvent>();

// Source: User input from CLI
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const userInput$ = xs.create<UserInputEvent>({
  start: (listener) => {
    rl.on("line", (text) => {
      listener.next({
        type: "UserInput",
        payload: { text, timestamp: Date.now() },
      });
    });
  },
  stop: () => rl.close(),
});

// Merge user input into main event stream
event$.addListener({
  next: () => {}, // Placeholder; actual handling below
});

export const mergedEvent$ = xs.merge(event$, userInput$);
