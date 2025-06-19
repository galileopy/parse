export interface Config {
  auth: { [provider: string]: { apiKey: string; lastUpdated: string } };
}

export const CONFIG_PATH = "~/.parse/config.json";

export function parseConfig(content: string): Config | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && "auth" in parsed) {
      return parsed as Config;
    }
    return null;
  } catch {
    return null;
  }
}

export function hasProviderKey(config: Config, provider: string): boolean {
  return provider in config.auth && !!config.auth[provider].apiKey;
}

export function createConfig(
  config: Config | null,
  provider: string,
  apiKey: string
): string {
  const newConfig: Config = config || { auth: {} };
  newConfig.auth[provider] = {
    apiKey,
    lastUpdated: new Date().toISOString(),
  };
  return JSON.stringify(newConfig, null, 2);
}

export function validateApiKey(key: string): boolean {
  return key.trim().length > 0;
}
