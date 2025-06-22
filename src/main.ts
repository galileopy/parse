import xs, { Stream } from "xstream";
import { REPLSources, REPLCommand } from "./drivers/repl";
import {
  FileOperation,
  FileOperationResult,
  FileSources,
} from "./drivers/files";
import { TerminationCommand, TerminationSources } from "./drivers/termination";
import { HTTPSources, HTTPRequest, HTTPResponse } from "./drivers/http";
import {
  Config,
  parseConfig,
  hasProviderKey,
  createConfig,
  validateApiKey,
  CONFIG_PATH,
} from "./modules/config/parse-config";
import { formatErrorLog, getErrorLogPath } from "./modules/config/error-log";

// Define sources and sinks for the main function
export interface Sources {
  REPL: REPLSources;
  Files: FileSources;
  HTTP: HTTPSources;
  Termination: TerminationSources;
}

export interface Sinks {
  REPL: Stream<REPLCommand>;
  Files: Stream<FileOperation>;
  HTTP: Stream<HTTPRequest>;
  Termination: Stream<TerminationCommand>;
}

// State for tracking authentication flow
interface MainState {
  config: Config | null;
  awaitingOverwrite: boolean;
  awaitingKey: boolean;
  lastOperationId: string | null;
  retryCount: number;
  retry: boolean;
  forceOverwrite: boolean;
  provider: string | null;
}

// Generate a simple unique ID (replace with UUID library if needed)
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Parse REPL input into FileOperation commands
function parseLineToFileOperation(
  input: string,
  state: MainState
): FileOperation | null {
  const parts = input.trim().split(" ");
  if (parts[0] === "read" && parts[1]) {
    return {
      command: "read",
      readParameters: { id: generateId(), path: parts[1], options: "utf8" },
    };
  } else if (parts[0] === "write" && parts[1] && parts[2]) {
    return {
      command: "write",
      writeParameters: {
        id: generateId(),
        path: parts[1],
        content: parts.slice(2).join(" "),
        options: "utf8",
      },
    };
  } else if (parts[0] === "/set-key") {
    if ((parts[1] === "-y" && parts[2] === "xai") || parts[1] === "xai") {
      const forceOverwrite = parts[1] === "-y";
      const id = generateId();
      return {
        command: "read",
        readParameters: { id, path: CONFIG_PATH, options: "utf8" },
      };
    }
  } else if (parts[0] === "/get-key" && parts[1] === "xai") {
    return {
      command: "read",
      readParameters: { id: generateId(), path: CONFIG_PATH, options: "utf8" },
    };
  }
  return null;
}

// Parse REPL input into REPL commands based on state
function parseLineToREPLCommand(
  input: string,
  state: MainState
): REPLCommand | null {
  if (state.awaitingOverwrite) {
    if (input.trim().toLowerCase() === "y") {
      return {
        command: "secure-prompt",
        message: `Enter ${state.provider} API key: `,
      };
    } else if (input.trim().toLowerCase() === "n") {
      return {
        command: "print",
        message: `Cancelled setting key for ${state.provider} [${state.lastOperationId}]`,
      };
    } else {
      return {
        command: "print",
        message: `Please enter 'y' or 'n' to confirm overwriting ${state.provider} key: `,
      };
    }
  } else if (state.awaitingKey && state.lastOperationId) {
    if (!validateApiKey(input)) {
      return {
        command: "print",
        message: `Error [${state.lastOperationId}]: API key cannot be empty, try again: `,
      };
    }
  }
  return null;
}

// Main function to process REPL input and produce output
export function main(sources: Sources): Sinks {
  const { REPL, Files, HTTP } = sources;

  // Initialize state
  const initState: MainState = {
    config: null,
    awaitingOverwrite: false,
    awaitingKey: false,
    lastOperationId: null,
    retryCount: 0,
    retry: false,
    forceOverwrite: false,
    provider: null,
  };

  // State stream
  const state$ = xs
    .merge(
      // Handle REPL input
      REPL.Line.map(({ input, isSecure }) => (state: MainState): MainState => {
        const parts = input.trim().split(" ");
        if (parts[0] === "/set-key") {
          const forceOverwrite = parts[1] === "-y";
          const provider = forceOverwrite ? parts[2] : parts[1];
          if (provider === "xai") {
            return {
              ...state,
              forceOverwrite,
              provider,
              lastOperationId: generateId(),
            };
          }
        } else if (parts[0] === "/get-key" && parts[1] === "xai") {
          return { ...state, provider: "xai", lastOperationId: generateId() };
        } else if (
          state.awaitingOverwrite &&
          input.trim().toLowerCase() === "y"
        ) {
          return { ...state, awaitingOverwrite: false, awaitingKey: true };
        } else if (
          state.awaitingOverwrite &&
          input.trim().toLowerCase() === "n"
        ) {
          return {
            ...state,
            awaitingOverwrite: false,
            lastOperationId: null,
            provider: null,
          };
        } else if (state.awaitingKey && isSecure && validateApiKey(input)) {
          return { ...state, awaitingKey: false };
        }
        return state;
      }),

      // Handle FileOperation results
      Files.Result.map(
        (result: FileOperationResult) =>
          (state: MainState): MainState => {
            if (result.id === state.lastOperationId) {
              if (result.command === "read" && result.success && result.data) {
                const config = parseConfig(result.data as string);
                if (
                  state.provider &&
                  !state.forceOverwrite &&
                  config &&
                  hasProviderKey(config, state.provider)
                ) {
                  return {
                    ...state,
                    config,
                    awaitingOverwrite: true,
                  };
                } else {
                  return {
                    ...state,
                    config,
                    awaitingKey: true,
                    forceOverwrite: false,
                  };
                }
              } else if (result.command === "read" && !result.success) {
                // Config file doesn't exist
                return {
                  ...state,
                  config: null,
                  awaitingKey: true,
                  forceOverwrite: false,
                };
              } else if (
                (result.command === "mkdir" ||
                  result.command === "write" ||
                  result.command === "chmod") &&
                !result.success
              ) {
                return {
                  ...state,
                  lastOperationId: null,
                  provider: null,
                };
              }
            }
            return state;
          }
      ),

      // Handle HTTP responses
      HTTP.select()
        .flatten()
        .map((response: Response) => (state: MainState): MainState => {
          if (response.request.category === state.lastOperationId) {
            if (response.status === 200) {
              return { ...state, retryCount: 0 };
            } else {
              const retry = state.retry && state.retryCount < 3;
              return {
                ...state,
                retryCount: retry ? state.retryCount + 1 : 0,
                awaitingKey: retry,
                lastOperationId: retry ? state.lastOperationId : null,
                provider: retry ? state.provider : null,
              };
            }
          }
          return state;
        })
    )
    .fold((state, reducer) => reducer(state), initState);

  // Generate FileOperation commands
  const fileCommand$ = xs
    .combine(REPL.Line, state$)
    .map(([{ input }, state]) => parseLineToFileOperation(input, state))
    .filter((cmd): cmd is FileOperation => cmd !== null)
    .map((cmd) => {
      if (
        cmd.command === "read" &&
        (input.startsWith("/set-key") || input.startsWith("/get-key"))
      ) {
        return {
          ...cmd,
          readParameters: { ...cmd.readParameters, id: state.lastOperationId! },
        };
      }
      return cmd;
    });

  // Generate additional FileOperation commands based on state
  const stateFileCommand$ = xs
    .combine(Files.Result, state$)
    .filter(([result, state]) => result.id === state.lastOperationId)
    .map(([result, state]): FileOperation | null => {
      if (
        (result.command === "read" && result.success && state.awaitingKey) ||
        (result.command === "read" && !result.success && state.awaitingKey)
      ) {
        return {
          command: "mkdir",
          mkdirParameters: {
            id: state.lastOperationId!,
            path: "~/.parse",
            mode: 0o700,
          },
        };
      } else if (
        result.command === "mkdir" &&
        result.success &&
        state.awaitingKey
      ) {
        return {
          command: "write",
          writeParameters: {
            id: state.lastOperationId!,
            path: CONFIG_PATH,
            content: "",
            options: "utf8",
          },
        };
      } else if (
        result.command === "write" &&
        result.success &&
        state.awaitingKey
      ) {
        return {
          command: "chmod",
          chmodParameters: {
            id: state.lastOperationId!,
            path: CONFIG_PATH,
            mode: 0o600,
          },
        };
      } else if (
        (result.command === "mkdir" ||
          result.command === "write" ||
          result.command === "chmod") &&
        !result.success
      ) {
        const timestamp = new Date().toISOString();
        return {
          command: "write",
          writeParameters: {
            id: generateId(),
            path: getErrorLogPath(timestamp),
            content: formatErrorLog(
              result.error!,
              state.lastOperationId!,
              timestamp
            ),
            options: "utf8",
          },
        };
      }
      return null;
    })
    .filter((cmd): cmd is FileOperation => cmd !== null);

  // Generate HTTP requests
  const httpRequest$ = xs
    .combine(REPL.Line, state$)
    .filter(([{ isSecure }, state]) => state.awaitingKey && isSecure)
    .map(([{ input }, state]) => ({
      category: state.lastOperationId!,
      url: "https://api.x.ai/v1/api-key",
      method: "GET",
      headers: { Authorization: `Bearer ${input}` },
      timeout: 5000,
      retry: state.retry,
      retryCount: state.retryCount,
    }));

  // Generate REPL commands
  const replCommand$ = xs
    .merge(
      xs.combine(REPL.Line, state$).map(([{ input, isSecure }, state]) => {
        if (state.awaitingOverwrite) {
          return parseLineToREPLCommand(input, state);
        } else if (state.awaitingKey && isSecure) {
          if (!validateApiKey(input)) {
            return {
              command: "print",
              message: `Error [${state.lastOperationId}]: API key cannot be empty, try again: `,
            };
          }
          return null;
        } else if (input.startsWith("/set-key")) {
          const parts = input.trim().split(" ");
          const provider = parts[1] === "-y" ? parts[2] : parts[1];
          if (
            provider === "xai" &&
            state.config &&
            hasProviderKey(state.config, provider)
          ) {
            return {
              command: "print",
              message: `Overwrite ${provider} key? (y/n): `,
            };
          } else if (provider === "xai") {
            return {
              command: "secure-prompt",
              message: `Enter ${provider} API key: `,
            };
          }
        } else if (input === "/get-key xai" && state.lastOperationId) {
          if (state.config && hasProviderKey(state.config, "xai")) {
            return {
              command: "print",
              message: `Key is set for xai [${state.lastOperationId}]`,
            };
          } else {
            return {
              command: "print",
              message: `No key set for xai [${state.lastOperationId}]`,
            };
          }
        }
        return null;
      }),
      Files.Result.map((result: FileOperationResult) => {
        if (
          result.command === "read" &&
          result.id === state$.value.lastOperationId
        ) {
          if (result.success && result.data) {
            const config = parseConfig(result.data as string);
            if (
              state$.value.provider &&
              !state$.value.forceOverwrite &&
              config &&
              hasProviderKey(config, state$.value.provider)
            ) {
              return {
                command: "print",
                message: `Overwrite ${state$.value.provider} key? (y/n): `,
              };
            } else {
              return {
                command: "secure-prompt",
                message: `Enter ${state$.value.provider} API key: `,
              };
            }
          } else if (!result.success) {
            return {
              command: "secure-prompt",
              message: `Enter ${state$.value.provider} API key: `,
            };
          }
        } else if (
          (result.command === "mkdir" ||
            result.command === "write" ||
            result.command === "chmod") &&
          !result.success &&
          result.id === state$.value.lastOperationId
        ) {
          return {
            command: "print",
            message: `Error [${result.id}]: Failed to ${result.command} ${result.error}`,
          };
        } else if (
          result.command === "chmod" &&
          result.success &&
          result.id === state$.value.lastOperationId
        ) {
          return {
            command: "print",
            message: `Key set successfully for ${state$.value.provider} [${result.id}]`,
          };
        }
        return null;
      }),
      HTTP.select()
        .flatten()
        .map((response: Response) => {
          if (response.request.category === state$.value.lastOperationId) {
            if (response.status === 200) {
              const state = state$.value;
              const config = state.config || { auth: {} };
              const key = state$.value.lastInput; // Store last secure input
              if (key && state.provider) {
                return {
                  command: "write",
                  writeParameters: {
                    id: state.lastOperationId!,
                    path: CONFIG_PATH,
                    content: createConfig(config, state.provider, key),
                    options: "utf8",
                  },
                };
              }
            } else {
              const retry = state$.value.retry && state$.value.retryCount < 3;
              const message = retry
                ? `Retry [${state$.value.retryCount + 1}/3]: Error [${response.request.category}]: ${response.status} ${response.error?.message || "Invalid key"}, try again: `
                : `Error [${response.request.category}]: ${response.status} ${response.error?.message || "Invalid key"}`;
              const timestamp = new Date().toISOString();
              return xs.of(
                {
                  command: "print",
                  message,
                },
                {
                  command: "write",
                  writeParameters: {
                    id: generateId(),
                    path: getErrorLogPath(timestamp),
                    content: formatErrorLog(
                      `${response.status} ${response.error?.message || "Invalid key"}`,
                      response.request.category,
                      timestamp
                    ),
                    options: "utf8",
                  },
                },
                retry
                  ? {
                      command: "secure-prompt",
                      message: `Enter ${state$.value.provider} API key: `,
                    }
                  : null
              );
            }
          }
          return null;
        })
        .flatten()
    )
    .filter((cmd): cmd is REPLCommand => cmd !== null);

  // Generate Termination commands
  const terminationCommand$ = REPL.Line.filter(
    (input) => input.trim() === "/quit"
  ).map(() => ({ command: "quit" }) as TerminationCommand);

  // Echo non-command inputs
  const echoOutput$ = REPL.Line.filter(
    ({ input }) =>
      !input.startsWith("read ") &&
      !input.startsWith("write ") &&
      input.trim() !== "/quit" &&
      !input.startsWith("/set-key") &&
      !input.startsWith("/get-key") &&
      !state$.value.awaitingOverwrite &&
      !state$.value.awaitingKey
  ).map(({ input }) => ({
    command: "print",
    message: `Echo: ${input}`,
  }));

  // Combine all REPL outputs
  const replOutput$ = xs.merge(replCommand$, echoOutput$);

  // Combine all FileOperation commands
  const allFileCommand$ = xs.merge(fileCommand$, stateFileCommand$);

  return {
    REPL: replOutput$,
    Files: allFileCommand$,
    HTTP: httpRequest$,
    Termination: terminationCommand$,
  };
}
