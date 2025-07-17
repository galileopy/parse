export type CommandHandler = (args: string[]) => Promise<string | void>;

export interface AuthConfig {
  provider: string;
  apiKey: string;
  preferredModel?: string;
}

export interface xAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface PromptResult {
  content: string;
  usage: xAIUsage;
}

export interface xAIChatMessage {
  role: "user" | "assistant";
  content: string;
  usage?: xAIUsage;
}

export interface xAIChatEntry {
  sessionId: string;
  messages: xAIChatMessage[];
}
