# Parse

## Purpose
Parse is a command-line tool designed to assist developers with coding tasks using large language models (LLMs). It provides code suggestions, debugging help, and workflow automation, making it a versatile coding assistant.

## Status
As of **July 11, 2025**, Parse is in active development. Recent updates include a modular refactoring for better extensibility:
- **Completed**: Reactive event loop with Cycle.js and xstream; REPL driver for CLI; file read/write and termination drivers; new /help command for usage info.
- **In Progress**: Authentication with xAI API; basic LLM prompt handling.
- **Upcoming**: Tool protocol for advanced features like code execution and versioning.

The modular design under `src/modules/` encapsulates features (e.g., files, help), ensuring pure FRP logic in the core while isolating side effects.

## Project Details
Parse explores LLMs for code assistance, emphasizing modularity, extensibility, and FRP.

### Key Technologies
- **xstream**: Reactive stream processing.
- **Cycle.js**: Dialog-based event loop.
- **TypeScript**: Type safety.
- **xAI API**: LLM integration (forthcoming).

### Development Approach
Incremental builds maintain a working system. Modules enable independent feature development; see `src/modules/README.md` for guidelines.

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
Welcome contributions! Review [TODO.md](TODO.md); submit issues/PRs on [GitHub](https://github.com/galileopy/parse). Use modular structure for new features.

## License
[GNU General Public License v3.0](LICENSE).

**Written with Grok**  
Code generated via [grok.com](https://grok.com) or [xAI Grok API](https://x.ai/api).
