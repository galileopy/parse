export type CommandHandler = (args: string[]) => Promise<string | void>;

export interface AuthConfig {
  provider: string;
  apiKey: string;
}
