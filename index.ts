import xs, { Stream } from "xstream";
import { CommandEvent, LLMResponseEvent, ParseEvent, UserInputEvent } from "./events";

// State for context (e.g., conversation history, auth)
interface ParseState {
  history: ParseEvent[];
  auth: { provider: string; token: string | null };
  selectedModel: string;
}

const initialState: ParseState = {
  history: [],
  auth: { provider: "xAI", token: null },
  selectedModel: "grok-3",
};

// Sink interfaces
interface Sinks {
  console$: Stream<string>;
  apiRequest$: Stream<{ url: string; body: unknown }>;
  toolExecution$: Stream<{ toolName: string; args: unknown }>;
  event$: Stream<ParseEvent>; // Feedback to event stream
}

// Main loop
function main(sources: { event$: Stream<ParseEvent> }): Sinks {
  const { event$ } = sources;

  // State stream
  const state$ = event$.fold(
    (state, event) => ({
      ...state,
      history: [...state.history, event],
    }),
    initialState
  );

  // Substreams by event type
  const userInput$ = event$.filter(
    (e): e is UserInputEvent => e.type === "UserInput"
  );
  const command$ = event$.filter(
    (e): e is CommandEvent => e.type === "Command"
  );
  const llmResponse$ = event$.filter(
    (e): e is LLMResponseEvent => e.type === "LLMResponse"
  );
  // Add other event filters as needed

  // Handle user input
  const userInputToAction$ = userInput$.map((event) => {
    const { text } = event.payload;
    if (text.startsWith("/")) {
      // Command
      const [command, ...args] = text.slice(1).split(" ");
      return {
        type: "Command" as const,
        payload: { command, args },
      };
    }
    // LLM query
    return {
      type: "LLMRequest" as const,
      payload: { query: text, requestId: crypto.randomUUID() },
    };
  });

  // Handle commands
  const commandToAction$ = command$.map((event) => {
    const { command, args } = event.payload;
    switch (command) {
      case "login":
        return {
          type: "RequestUserApproval" as const,
          payload: {
            message: "Enter API token for xAI:",
            requestId: crypto.randomUUID(),
          },
        };
      case "exit":
        process.exit(0);
        return null;
      case "clear":
        return { type: "ClearContext" as const, payload: {} };
      case "free":
        return { type: "FreeContext" as const, payload: {} };
      case "model":
        return {
          type: "SelectModel" as const,
          payload: { model: args?.[0] || "grok-3" },
        };
      default:
        return {
          type: "ConsoleOutput" as const,
          payload: `Unknown command: ${command}`,
        };
    }
  });

  // Handle LLM responses
  const llmResponseToConsole$ = llmResponse$.map(
    (event) => event.payload.response
  );

  // API requests
  const apiRequest$ = userInputToAction$
    .filter((action) => action.type === "LLMRequest")
    .compose((stream) =>
      stream.combine(state$).map(([action, state]) => ({
        url: "https://api.x.ai/v1/grok", // Example endpoint
        body: {
          query: action.payload.query,
          model: state.selectedModel,
          token: state.auth.token,
        },
      }))
    );

  // Console output
  const console$ = xs.merge(
    llmResponseToConsole$,
    commandToAction$
      .filter((action) => action?.type === "ConsoleOutput")
      .map((action) => action.payload as string),
    userInputToAction$
      .filter((action) => action.type === "RequestUserApproval")
      .map((action) => action.payload.message)
  );

  // Feedback events (e.g., new events triggered by actions)
  const feedbackEvent$ = xs.merge(
    userInputToAction$
      .filter((action) => action.type === "Command")
      .map((action) => ({
        type: "Command",
        payload: action.payload,
      })),
    commandToAction$
      .filter((action) => action?.type === "RequestUserApproval")
      .map((action) => ({
        type: "RequestUserApproval",
        payload: action.payload,
      }))
    // Add other feedback events
  );

  return {
    console$,
    apiRequest$,
    toolExecution$: xs.never(), // Placeholder
    event$: feedbackEvent$,
  };
}

// Run the loop
const sinks = main({ event$: mergedEvent$ });

// Sink handlers
sinks.console$.addListener({
  next: (message) => console.log(message),
});

sinks.apiRequest$.addListener({
  next: async ({ url, body }) => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      event$.shamefullySendNext({
        type: "LLMResponse",
        payload: { response: data.result, requestId: body.requestId },
      });
    } catch (error) {
      console.error("API error:", error);
    }
  },
});
