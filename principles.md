# Parse Development Principles

This document outlines key principles for maintaining code quality, consistency, and reliability in the Parse project. Adhere to these when making changes to ensure the codebase remains robust and easy to extend.

1. **Fail Hard with Thrown Errors**: On failures (e.g., I/O errors, invalid states), throw exceptions (Error or subclasses) instead of returning masked values like strings. This promotes explicit handling, better debugging, and avoids silent failures. Mask only at user-facing boundaries (e.g., CLI output) by catching and logging.
2. **Strict Typing**: Use TypeScript fully—no 'any', prefer type guards/unions/interfaces. All functions/parameters/returns typed explicitly.
3. **Modularity and Single Responsibility**: Keep files/functions focused (e.g., config.ts only handles auth persistence). Use small, testable units.
4. **Incremental Changes**: Updates should be small, testable, and keep the system functional. Include tests for each change.
5. **User-Friendly CLI**: Errors/notifications should be clear and actionable in the REPL, but internal logic fails hard.
6. **Test Colocation and Coverage**: Place \*.test.ts beside sources, cover happy/error paths, use isolation (e.g., temp dirs, no state bleed).
