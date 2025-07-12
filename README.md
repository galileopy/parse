# Parse

## Purpose
Parse is a command-line tool designed to assist developers with coding tasks using large language models (LLMs). It provides code suggestions, debugging help, and workflow automation, making it a versatile coding assistant.

## Status
As of **July 12, 2025**, Parse is in active development. Recent updates include a refactor introducing "components" for pure reactive logic (e.g., help, quit, echo), building on the modular design:
- **Completed**: Reactive event loop with Cycle.js and xstream; REPL driver for CLI; file read/write and termination drivers; /help command for usage info (now handled via components for better composability).
- **In Progress**: Authentication with xAI API; basic LLM prompt handling.
- **Upcoming**: Tool protocol for advanced features like code execution and versioning.

The design separates concerns: `src/modules/` for drivers (side effects like I/O), `src/components/` for pure FRP components (stream transformations). This enhances reusability and testability while isolating side effects.

## Project Details
Parse explores LLMs for code assistance, emphasizing modularity, extensibility, and FRP.

### Key Technologies
- **xstream**: Reactive stream processing.
- **Cycle.js**: Dialog-based event loop.
- **TypeScript**: Type safety.
- **xAI API**: LLM integration (forthcoming).

### Development Approach
Incremental builds maintain a working system. Modules handle drivers; components encapsulate reactive features. See `src/modules/README.md` for module guidelines and `src/components/README.md` for component details.

For next steps, see [TODO.md](TODO.md).

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/galileopy/parse.git
   cd parse
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the application**:
   ```bash
   npm run dev
   ```
   Launches CLI with `Parse >` prompt. Commands:
   - `/read <path>`: Read file.
   - `/write <path> <content>`: Write file.
   - `/help [command|command|...]`: Show help (e.g., `/help read|write` or `/help` for all).
   - `/quit` or `/exit`: Exit.
   Non-commands echo back.

4. **Authentication**:
   `login` command upcoming for xAI API.

## Contributing
Welcome contributions! Review [TODO.md](TODO.md); submit issues/PRs on [GitHub](https://github.com/galileopy/parse). Use modular/component structure for new features.

## License
[GNU General Public License v3.0](LICENSE).

**Written with Grok**  
Code generated via [grok.com](https://grok.com) or [xAI Grok API](https://x.ai/api).
