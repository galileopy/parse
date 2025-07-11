# Parse Modules

Modules encapsulate features like drivers, APIs, and types for modularity and extensibility in Parse's FRP architecture. Each module lives in its own subdirectory (e.g., `files/`) and exports via `index.ts`.

## How to Build a Module

1. **Directory Structure**: Create a subdir with:

   - `api.ts`: Pure functions for input filtering (`inputFilter`), command conversion (`inputToCommand`), and output mapping (e.g., `resultToOutput` or `commandToOutput`).
   - `driver.ts`: Cycle.js driver factory (e.g., `make<Feature>Driver`) handling streams and side effects.
   - `types.ts`: Type definitions (e.g., commands, sources, sinks).
   - Optional: `error.ts` for custom errors; operation files (e.g., `read.operation.ts`) for async logic.
   - `index.ts`: Export API functions and driver; re-export types.

2. **Conventions**:

   - Use discriminated unions for commands (e.g., `{ command: 'feature'; params?: ... }`).
   - Filters return booleans; converters map strings to commands or errors.
   - Drivers isolate side effects (e.g., file I/O, process.exit).
   - Keep pure: No side effects in API; use xstream for reactive handling.

3. **Integration**: In `src/main.ts`, import and use module functions to filter/map streams (e.g., `Module.inputFilter`, `Module.inputToCommand`).
   - Add driver to `src/index.ts` drivers object.

Example: See `files/` for file ops or `help/` for simple command handling. Test incrementally to maintain a working system.
