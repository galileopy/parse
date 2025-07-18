import { ChatCompletionResponse } from "./providers/xai/xai.types";

export type CommandHandler = (args: string[]) => Promise<string | void>;

export interface AuthConfig {
  provider: string;
  apiKey: string;
  preferredModel?: string;
}

export interface ParseUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ParseChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  usage?: ParseUsage;
  tool_call_id?: string; // Optional for tool responses
}

export interface ParseChatEntry {
  sessionId: string;
  messages: ParseChatMessage[];
}
export interface PromptResult {
  content: string;
  usage: ParseUsage;
}

export interface IFileOpsService {
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, content: string): Promise<string>;
  ensureDir(dirPath: string): Promise<void>;
  listDir(dirPath: string): Promise<string[]>;
  renameFile(oldPath: string, newPath: string): Promise<string>;
  deleteFile(path: string): Promise<string>;
}

export interface ILlmService {
  sendPrompt(
    messages: ParseChatMessage[],
    model?: string
  ): Promise<ChatCompletionResponse>; // Updated for history
  extractResult(response: ChatCompletionResponse): PromptResult; // Added helper
}

export interface IConfigService {
  loadConfig(dirPath?: string): Promise<void>;
  saveConfig(
    provider: string,
    apiKey: string,
    dirPath?: string,
    preferredModel?: string
  ): Promise<void>;
  getConfig(): AuthConfig | null;
  getConfigDir(dirPath?: string): string;
  getDefaultModel(): string;
}

export interface ICommandService {
  executeCommand(cmd: string, args: string[]): Promise<string | void>;
}

export interface IStorageService {
  initDb(): Promise<void>;
  saveSession(entry: ParseChatEntry): Promise<void>;
}

export interface ILoggerService {
  log(message: string): void;
  info(message: string): void;
  error(message: string): void;
  debug(message: string): void; // Optional level for verbose output
  warn(message: string): void;
}

export interface IToolRegistry {
  register(tool: ITool): void;
  getAll(): ITool[];
  get(name: string): ITool | undefined;
}

export interface ITool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(args: Record<string, unknown>): Promise<string>;
}
