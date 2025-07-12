# Parse Components

Components in Parse encapsulate pure, reactive logic for handling specific features or commands within the FRP architecture. Unlike modules (which focus on drivers for side effects like I/O or termination), components are driver-agnostic and transform input streams (sources) into output streams (sinks) using xstream operators. They promote reusability, composability, and testability by keeping logic isolated and side-effect-free.

Components are located in `src/components/` and follow a functional style: each is a function that takes sources (e.g., REPL input, props streams) and returns sinks (e.g., commands, outputs, errors). This allows easy composition in `src/main.ts` or other parts of the app.

## How to Build a Component

1. **File Structure**: For simple components, use a single file like `feature.ts` or `index.ts`. For complex ones (e.g., using MVI), create a subdirectory (e.g., `help/`) with:

   - Input filtering: A function to check if REPL input matches (e.g., starts with `/help`).
   - Command mapping: Convert valid input to a command object or handle errors.
   - Output generation: Map results or commands to strings for REPL output.
   - Main function: Export a function (e.g., `Help`) that takes sources and returns sinks.
   - Optional: Split files like `intent.ts`, `model.ts`, `view.ts`, `types.ts` for MVI-style organization.

2. **Sources and Sinks**:

   - **Sources**: Typically include `REPL: REPLSources` (for user input) and optional `props` (custom streams, e.g., for internal triggers like errors from other components).
   - **Sinks**: Streams like `output$` (for REPL messages), `command$` (for driver sinks), or `error$` (for propagation).
   - Use TypeScript interfaces for type safety (e.g., `HelpSources`, `HelpSinks`).

3. **Conventions**:

   - Keep everything pure: Use `filter`, `map`, `merge` from xstream; avoid side effects.
   - Handle errors explicitly (e.g., via `error$` streams).
   - Support extensibility: Allow `props` for dynamic behavior (e.g., specific help topics via `internal$`).
   - Integrate with modules: Components produce commands for drivers (e.g., file ops) and consume driver sources (e.g., results), but don't create drivers.

4. **Integration**: In `src/main.ts`, instantiate components with sources, merge their sinks, and route to drivers (e.g., `xs.merge(component1.output$, component2.output$)` for REPL output, or `component.command$` to a driver sink).

Examples:

- `help/`: Filters `/help` or `\` inputs, generates help text (all or specific), supports internal triggers via `props.internal$`. Uses MVI for structure.
- `files/`: Filters `/read` or `/write`, maps to FileOperations, handles errors, and formats results for output. Integrates with Files driver.
- `quit/`: Filters `/quit` or `/exit`, produces Termination commands.
- `echo/`: Echoes non-command inputs for fallback handling.

Test components in isolation with mocked streams (e.g., using xstream's `of` or `periodic`) to verify reactive behavior. This structure builds on Parse's modularity, enabling easy addition of features like authentication or LLM prompts without bloating the main loop. For driver-based features, use modules instead (see `src/modules/README.md`).

## Internal Composition (Optional MVI Framework)

For more structured components, follow the Model-View-Intent (MVI) pattern:

- **Intent**: Extract specific inputs from sources and generate an `Actions` object (e.g., filter and map REPL lines).
- **Model**: Takes `Actions` and maps them into a `State` or operation (e.g., command objects).
- **View**: Produces a representation of the state as sinks (e.g., output strings).

The `Help` component uses this for guidelines; simpler ones like `Echo` or `Quit` may skip it for direct stream ops.
