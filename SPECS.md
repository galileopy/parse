## Requirements

### Functional Requirements

1. **Conversation Loop**:
   - The system accepts user input via a CLI text prompt.
   - Processes the input as an event in a stream and produces appropriate responses or actions.
   - Waits for further user input after completing a round of actions, maintaining a dialog-style interaction.
2. **Event Types**:
   - **User Input**: Text entered by the user (e.g., questions, commands, or prompts).
   - **LLM Response**: Response from an AI model (e.g., via xAI API or other providers).
   - **Tool Call**: Invocation of external tools or functions (e.g., API calls, scripts).
   - **Tool Setup**: Configuration or initialization of tools before use.
   - **Request User Approval**: Prompt the user for confirmation (e.g., for sensitive actions).
   - **Command**: Special CLI commands (e.g., `login`, `exit`, `clear`, `free`, `pick model`).
   - The system must be extensible to support additional event types.
3. **Event Handling**:
   - Events are processed as a stream using xstream.
   - Each event triggers a series of operations (e.g., API calls, UI updates, or state changes).
   - The system supports branching logic (e.g., user input may lead to an LLM response or a command execution).
4. **Authentication**:
   - Supports authentication with the xAI API (e.g., API key or token).
   - Extensible to support other LLM providers (e.g., OpenAI, Anthropic).
   - Handles authentication-related events (e.g., `login` command, token refresh).
5. **Extensibility**:
   - New event types and actions can be added without modifying core logic.
   - Modular design for integrating new tools, commands, or providers.
6. **Functional Reactive Style**:
   - Uses FRP principles: immutable data, pure functions, and reactive streams.
   - Avoids side effects in core logic, isolating them to specific sinks (e.g., console output, API calls).

### Non-Functional Requirements

1. **Language**: TypeScript for type safety and maintainability.
2. **Stream Library**: xstream for lightweight, reactive stream processing.
3. **CLI Interface**:
   - Simple, text-based UI using Node.js (e.g., `readline` for input).
   - Clear feedback to the user (e.g., responses, errors, prompts).
4. **Performance**: Low latency for user interactions; asynchronous handling of API calls.
5. **Error Handling**: Graceful recovery from errors (e.g., API failures, invalid input).
6. **Modularity**: Code organized for reusability and testing.

---

## Specification: Main Conversation Loop

The main conversation loop is modeled as a **Dialogue** (per Cycle.js’s abstraction), where the system and user engage in a back-and-forth exchange. The loop is implemented as a series of operations over an event stream, using xstream to manage events and TypeScript for type safety. Below is a detailed specification, focusing on implementation details.

### 1. Architecture Overview

- **Dialogue Abstraction**: The user and system exchange “utterances” (events). User input is an utterance, and the system responds with utterances like LLM responses, tool outputs, or prompts.
- **Event Stream**: A single xstream stream (`event$`) carries all events (e.g., `UserInput`, `LLMResponse`, `ToolCall`). Events are processed reactively, with operations mapped to appropriate handlers.
- **Sources and Sinks**:
  - **Sources**: User input (CLI), API responses, tool outputs.
  - **Sinks**: Console output, API requests, tool executions, state updates.
- **FRP Approach**: Events are transformed using pure functions (e.g., `map`, `filter`, `fold`). Side effects (e.g., printing to console, API calls) are isolated to sinks.

### 2. Event Model

Events are represented as a discriminated union in TypeScript for type safety and extensibility. Each event has a `type` and a `payload`.


### 3. Stream Setup with xstream

The main conversation loop is driven by an xstream stream (`event$`) that merges multiple event sources. Each source emits `ParseEvent` objects.


### 4. Conversation Loop Logic

The loop processes events reactively, transforming `event$` into sinks (e.g., console output, API requests). The Dialogue abstraction is implemented as a cycle of:

- **User utterance** (input) → System processing → **System utterance** (output) → Wait for next user input.

#### Steps:

1. **Filter Events**: Split `event$` into substreams by event type (e.g., `userInput$`, `command$`, `llmResponse$`).
2. **Map to Actions**: Transform events into actions (e.g., API calls, console outputs) using pure functions.
3. **Handle Side Effects**: Route actions to sinks (e.g., print to console, send API request).
4. **Maintain State**: Use `fold` to track context (e.g., conversation history, authentication status).

#### Implementation:

### 5. Extensibility

- **New Event Types**: Add new interfaces to the `ParseEvent` union (e.g., `CustomToolEvent`).
- **New Handlers**: Extend `commandToAction$` or add new substreams (e.g., `customTool$`) with `switch` or pattern matching.
- **New Providers**: Update `apiRequest$` to support different endpoints based on `state.auth.provider`.
- **Plugins**: Allow external modules to register new event types and handlers via a plugin system.

### 6. Authentication

- **Login Command**: Prompts for an API token, stores it in `state.auth`.
- **Provider Support**: Use a provider registry (e.g., `{ 'xAI': { url, authMethod } }`) to handle different APIs.
- **Token Refresh**: Add a `TokenRefreshEvent` for providers requiring periodic re-authentication.

### 7. Error Handling

- **Invalid Input**: Filter and respond with error messages (e.g., “Invalid command”).
- **API Failures**: Catch errors in `apiRequest$` and emit `ConsoleOutput` events.
- **Stream Errors**: Use xstream’s error handling (e.g., `addListener({ error })`).

### 8. CLI Interface

- **Input**: Use Node.js `readline` for non-blocking input.
- **Output**: Print responses, errors, and prompts to `stdout`.
- **Prompt**: Display a `>` or `Parse>` prompt after each system utterance.

---

## Implementation Notes

- **Type Safety**: Use TypeScript’s discriminated unions and strict typing to ensure event handling is robust.
- **FRP Purity**: Keep transformations pure; isolate side effects to sinks.
- **Testing**: Write unit tests for event handlers using xstream’s `MemoryStream` and Jest.
- **Modularity**: Split code into modules (e.g., `events.ts`, `handlers.ts`, `sinks.ts`).
- **Performance**: Use xstream’s lightweight operators; debounce or throttle input if needed.

