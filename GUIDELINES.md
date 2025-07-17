# Parse Testing Guidelines

This document outlines best practices for writing tests in the Parse project to ensure they are robust, maintainable, and aligned with clean code principles. These guidelines build on principles.md, emphasizing modularity, isolation, and coverage while avoiding anti-patterns like accessing private members.

## Core Rules
1. **Public Interfaces Only**: All tests must interact exclusively via public methods, properties, or observable side effects (e.g., file I/O, console output, network calls). Do not access private/protected members (e.g., via `(service as any).privateProp` or type assertions)—this breaks encapsulation and makes tests brittle to refactors.
   - **Rationale**: Tests should mimic real usage; if a private detail needs testing, expose it publicly or verify through effects.
   - **Example Violation**: Directly accessing a private DB instance in a service test.
   - **Fix**: Add a public getter or verify via side effects (e.g., read the persisted file).

2. **Observable Side Effects**: For components with side effects (e.g., file writes, API calls), mock dependencies (e.g., via Jest spies) and assert on calls or outputs. Use temp dirs/files for I/O isolation to prevent state bleed.
   - **Rationale**: Ensures tests are deterministic and focused on behavior, not internals.

3. **Coverage Focus**: Cover happy paths, error paths, and edge cases. Aim for 80%+ coverage, prioritizing critical modules (e.g., config, LLM).
   - Include assertions for thrown errors in async tests (e.g., `await expect(fn()).rejects.toThrow()`).

4. **Isolation and Mocks**: Use mocks for dependencies (e.g., interfaces like `IConfigService`) to isolate units. Colocate tests (e.g., `module.test.ts` next to `module.ts`). Avoid global state; reset mocks/spies each test.
   - **Tools**: Jest for unit/integration; temp dirs (os.tmpdir()) for FS tests.

5. **Async Handling**: Always await async calls in tests; use `async/await` for readability. Handle promises properly to avoid uncaught errors.

6. **No Production Code in Tests**: Do not add test-only code (e.g., public methods just for testing) unless it adds real value (e.g., a useful getter).

## Applying Guidelines
- Review existing tests for violations and refactor (e.g., add public methods if needed).
- For new features, design with testability in mind—favor public APIs over hidden state.
- Run `npm test` after changes; aim for zero warnings/errors.

These guidelines ensure tests remain effective as the project evolves, supporting incremental development and modularity.