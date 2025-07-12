# Parse Modules

Modules in Parse encapsulate drivers and related utilities for handling side effects (e.g., I/O, termination) in the FRP architecture. They promote modularity by isolating impure operations from pure reactive logic (which lives in `src/components/`). Each module lives in its own subdirectory (e.g., `filesystem/`) and exports via `index.ts`.

For pure stream transformations (e.g., input filtering, command mapping), see `src/components/README.md`. Modules focus on drivers that consume command streams and produce result streams with side effects.

## How to Build a Module

1. **Directory Structure**: Create a subdir with:

   - `driver.ts`: Cycle.js driver factory (e.g., `make<Feature>Driver`) that handles sink streams, performs side effects, and produces source streams.
   - `types.ts`: Type definitions (e.g., commands as discriminated unions, sources, sinks).
   - Optional: Operation files (e.g., `read.operation.ts`) for async side-effect logic (e.g., file reads).
   - `index.ts`: Export the driver factory; re-export types.

2. **Conventions**:

   - Use discriminated unions for commands (e.g., `{ command: 'feature'; params?: ... }`).
   - Drivers isolate side effects (e.g., file I/O in `filesystem/`, `process.exit` in `termination/`).
   - Keep drivers focused: Subscribe to sinks for actions, use `xs.fromPromise` for async ops, and emit results via sources.
   - No pure logic here: Input filtering, command conversion, and output mapping belong in components.

3. **Integration**: In `src/main.ts`, instantiate components to produce command streams, then route them to module drivers as sinks.
   - Add the driver factory to the `drivers` object in `src/index.ts` (e.g., `Files: Filesystem.makeDriver()`).

Examples:

- `filesystem/`: Driver for file read/write ops; consumes `FileOperation` commands and produces results.
- `repl/`: Driver for CLI input/output; handles user lines and prints messages.
- `termination/`: Driver for app shutdown; exits on `quit` commands.

Test modules incrementally: Mock sink streams to verify side effects (e.g., using Jest spies on `fs` or `process.exit`). For component integration, see `src/components/README.md`.
