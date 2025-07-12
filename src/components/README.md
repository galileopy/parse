# Parse Components

Components in Parse encapsulate pure, reactive logic for handling specific features or commands within the FRP architecture. Unlike modules (which may include drivers for side effects like I/O or termination), components are driver-agnostic and focus on transforming input streams (sources) into output streams (sinks) using xstream operators. They promote reusability, composability, and testability by keeping logic isolated and side-effect-free.

Components are located in `src/components/` and follow a functional style: each is a function that takes sources (e.g., REPL input, props streams) and returns sinks (e.g., commands, outputs, errors). This allows easy composition in `src/main.ts` or other parts of the app.

## How to Build a Component

1. **File Structure**: Create a file like `feature.ts` (e.g., `help.ts`) with:

   - Input filtering: A function to check if REPL input matches (e.g., starts with `/help`).
   - Command mapping: Convert valid input to a command object or handle errors.
   - Output generation: Map results or commands to strings for REPL output.
   - Main function: Export a function (e.g., `Help`) that takes sources and returns sinks.

2. **Sources and Sinks**:

   - **Sources**: Typically include `REPL: REPLSources` (for user input) and optional `props$` (custom streams, e.g., for internal triggers like errors from other components).
   - **Sinks**: Streams like `output$` (for REPL messages), `command$` (for driver sinks), or `error$` (for propagation).
   - Use TypeScript interfaces for type safety (e.g., `HelpSources`, `HelpSinks`).

3. **Conventions**:

   - Keep everything pure: Use `filter`, `map`, `merge` from xstream; avoid side effects.
   - Handle errors explicitly (e.g., via `error$` streams).
   - Support extensibility: Allow `props$` for dynamic behavior (e.g., specific help topics).
   - Integrate with modules: Components can consume sources from drivers (e.g., file results) but don't create them.

4. **Integration**: In `src/main.ts`, instantiate components with sources, merge their sinks, and route to drivers (e.g., `xs.merge(component1.output$, component2.output$)` for REPL).

Examples:

- `help.ts`: Filters `/help`, generates help text (all or specific), supports internal triggers via `props.internal$`.
- `quit.ts`: Filters `/quit` or `/exit`, produces Termination commands.
- `echo.ts`: Echoes non-command inputs for fallback handling.

Test components in isolation with mocked streams to ensure reactive behavior. This structure builds on Parse's modularity, enabling easy addition of features like authentication or LLM prompts without bloating the main loop. For driver-based features, use modules instead (see `src/modules/README.md`).

## Internal Composition

When appropriate you can follow the Model-View-Intent framework where

- Intent: extract specific inputs form the `Sources` and generate an `Action` object
- Model: Takes an `Action` and maps that into a `State`
- View: Produces a representation of the `State` to present to the user as an `Output`

The `Help` component was implemented in this manner to provide some guidelines.
