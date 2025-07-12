# Parse (Imperative Rewrite)

A simple CLI tool for code assistance using LLMs. Features: REPL with commands for file ops, help, quit, and auth config.

## Setup

npm install npm run dev

Commands:

- /read <path>: Read file.
- /write <path> <content>: Write file.
- /help [command]: Show help.
- /quit: Exit.
- /login <provider> <apiKey>: Save auth config to ~/.parse/config.json. Non-commands echo back.

Auth loads on start; notifies if missing.
