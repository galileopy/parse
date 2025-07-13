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
   - Events are processed asynchronously using modular handlers.
   - Each event triggers a series of operations (e.g., API calls, UI updates, or state changes).
   - The system supports branching logic (e.g., user input may lead to an LLM response or a command execution).
4. **Authentication**:
   - Supports authentication with the xAI API (e.g., API key or token).
   - Extensible to support other LLM providers (e.g., OpenAI, Anthropic).
   - Handles authentication-related events (e.g., `login` command, token refresh).
5. **Extensibility**:
   - New event types and actions can be added without modifying core logic.
   - Modular design for integrating new tools, commands, or providers.
6. **Simple Async Style**:
   - Uses async/await for handling inputs and responses.
   - Avoids complex reactive frameworks; keeps logic pure with modular functions.

### Non-Functional Requirements

1. **Language**: TypeScript for type safety and maintainability.
2. **CLI Interface**:
   - Simple, text-based UI using Node.js (e.g., `readline` for input).
   - Clear feedback to the user (e.g., responses, errors, prompts).
3. **Performance**: Low latency for user interactions; asynchronous handling of API calls.
4. **Error Handling**: Graceful recovery from errors (e.g., API failures, invalid input).
5. **Modularity**: Code organized for reusability and testing.

---

## Specification: Main Conversation Loop

The main conversation loop is implemented as a simple async loop using `readline` in `main.ts`, where the system and user engage in a back-and-forth exchange. User input is processed directly, and the system responds with outputs like LLM responses, tool results, or prompts.

### 1. Architecture Overview

- **Loop Abstraction**: User inputs are handled sequentially in an async callback, with commands dispatched to handlers and prompts sent to LLM.
- **Event Handling**: Inputs are parsed and routed to modular functions (e.g., from `commands.ts`).
- **Sources and Sinks**:
  - **Sources**: User input (CLI), API responses, tool outputs.
  - **Sinks**: Console output, API requests, tool executions, state updates.
- **Async Approach**: Events are transformed using async functions. Side effects (e.g., printing to console, API calls) are isolated to specific modules.

### 2. Event Model

Events are represented as a discriminated union in TypeScript for type safety and extensibility. Each event has a `type` and a `payload`.

### 3. Loop Setup

The main conversation loop is driven by `readline`'s "line" event in `main.ts`, merging inputs and processing them asynchronously.

### 4. Conversation Loop Logic

The loop processes inputs directly, transforming them into outputs.

#### Steps:

1. **Parse Inputs**: Check if command (starts with `/`) or prompt.
2. **Dispatch to Handlers**: Use modular functions for commands or LLM calls.
3. **Handle Side Effects**: Route to console or external calls.
4. **Maintain State**: Use simple cached variables (e.g., for config).

#### Implementation:

Keep the existing `main.ts` structure, extending with new handlers as needed.

### 5. Extensibility

- **New Event Types**: Add new interfaces to a potential `ParseEvent` union (e.g., `CustomToolEvent`).
- **New Handlers**: Extend command map or add conditionals in the loop.
- **New Providers**: Update API calls to support different endpoints based on state.
- **Plugins**: Allow external modules to register new handlers via a registry.

### 6. Authentication

- **Login Command**: Prompts for an API token, stores it in state.
- **Provider Support**: Use a provider registry (e.g., `{ 'xAI': { url, authMethod } }`) to handle different APIs.
- **Token Refresh**: Add handling for providers requiring re-authentication.

### 7. Error Handling

- **Invalid Input**: Respond with error messages (e.g., “Invalid command”).
- **API Failures**: Catch and log errors.
- **Loop Errors**: Use try/catch in the input handler.

### 8. CLI Interface

- **Input**: Use Node.js `readline` for non-blocking input.
- **Output**: Print responses, errors, and prompts to `stdout`.
- **Prompt**: Display a `>` or `Parse>` prompt after each response.

---

## Implementation Notes

- **Type Safety**: Use TypeScript’s discriminated unions and strict typing to ensure handling is robust.
- **Purity**: Keep functions pure where possible; isolate side effects.
- **Testing**: Write unit tests for handlers using Jest.
- **Modularity**: Split code into modules (e.g., `events.ts`, `handlers.ts`).
- **Performance**: Use async/await; debounce input if needed.
