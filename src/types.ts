// src/types.ts
// (Expanded: Added interfaces for DI and abstractions)
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
  role: "user" | "assistant";
  content: string;
  usage?: ParseUsage;
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
}

export interface ILlmService {
  sendPrompt(prompt: string): Promise<PromptResult>;
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
