# Parse

## Purpose
Parse is a command-line tool designed to assist developers with coding tasks using large language models (LLMs). It provides code suggestions, debugging help, and workflow automation, making it a versatile coding assistant.

## Status
As of **June 14, 2025**, Parse is in active development. The project is currently focused on building its foundational components, including:
- Setting up the event loop using [xstream](https://github.com/staltz/xstream) for reactive event handling.
- Implementing authentication with the [xAI API](https://x.ai/api) to enable LLM-powered features.
- Enabling basic interactions, such as parsing user prompts and fetching LLM responses.
- Developing a protocol for tool interactions (e.g., file system operations, running commands) to extend Parse's capabilities.

This is an early-stage project, with ongoing work to implement core features and ensure a stable, working system at each milestone.

## Project Details
Parse is a personal experiment aimed at exploring the potential of LLMs for code assistance. The project is being developed with a focus on modularity, extensibility, and functional reactive programming (FRP) principles.

### Key Technologies
- **xstream**: For lightweight, reactive stream processing to manage events and user interactions.
- **TypeScript**: For type safety and maintainability.
- **xAI API**: To integrate LLM capabilities for generating code suggestions and responses.

### Development Approach
The project is being built incrementally, with a focus on maintaining a working system at each step. Key milestones include:
- Setting up the initial dialog loop with an echo sink.
- Implementing authentication and API integration.
- Enabling basic LLM interactions and tool calling.
- Expanding tool support for tasks like file management, code execution, and version control.

For a detailed list of next steps, see [TODO.md](TODO.md).

## Getting Started
To get started with Parse, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/galileopy/parse.git
   cd parse
   ```

2. **Install dependencies**:
   Parse uses Node.js (v22.16.0 or later). Install the required packages with:
   ```bash
   npm install
   ```

3. **Run the application**:
   Currently, the application is in early development. To run the initial prototype:
   ```bash
   npm start
   ```
   This will launch the CLI interface, where you can begin interacting with the system.

4. **Authentication**:
   Use the `login` command to authenticate with the xAI API. You will be prompted to enter your API token.

## Contributing
Parse is an open-source project, and contributions are welcome! If you'd like to contribute:
- Check out the [TODO.md](TODO.md) for current development priorities.
- Submit issues or pull requests on the [GitHub repository](https://github.com/galileopy/parse).

## License
Parse is licensed under the [GNU General Public License v3.0](LICENSE).

**Written with Grok**  
The majority of the code for Parse is intended to be generated using outputs from the [grok.com web app](https://grok.com) or the [xAI Grok API](https://x.ai/api).