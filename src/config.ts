import os from "os";
// import fetch from "node-fetch"; // New import
import { readFile, writeFile, ensureDir } from "./file-ops";
import { AuthConfig } from "./types";

function getConfigDir(dirPath?: string): string {
  return dirPath ?? `${os.homedir()}/.parse`;
}

let cachedConfig: AuthConfig | null = null;

/**
 * Validates apiKey against xAI API.
 * @param apiKey - Key to test.
 * @throws Error on invalid (non-200 response).
 */
async function validateApiKey(apiKey: string): Promise<void> {
  const response = await fetch("https://api.x.ai/v1/api-key", {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    throw new Error(
      `Invalid API key: ${response.status} ${response.statusText}`
    );
  }
}

/**
 * Loads and validates auth config.
 * @param dirPath - Optional dir override.
 * @throws Error on failure/missing/invalid.
 */
export async function loadConfig(dirPath?: string): Promise<void> {
  const configDir = getConfigDir(dirPath);
  const configPath = `${configDir}/config.json`;
  const data = await readFile(configPath);
  if (data.startsWith("File not found") || data.startsWith("Error reading")) {
    cachedConfig = null;
    throw new Error(`Config not found: ${data}`);
  }
  try {
    const config = JSON.parse(data) as AuthConfig;
    await validateApiKey(config.apiKey); // New: API test
    cachedConfig = config;
  } catch (parseErr: unknown) {
    cachedConfig = null;
    throw new Error(`Invalid config: ${(parseErr as Error).message}`);
  }
}

/**
 * Saves and validates auth config.
 * @param provider - Provider (e.g., xAI).
 * @param apiKey - API key.
 * @param dirPath - Optional dir override.
 * @throws Error on failure/invalid.
 */
export async function saveConfig(
  provider: string,
  apiKey: string,
  dirPath?: string
): Promise<void> {
  if (provider.trim() === "" || apiKey.trim() === "") {
    throw new Error("Invalid provider or apiKey.");
  }
  await validateApiKey(apiKey); // New: Pre-save validation
  const configDir = getConfigDir(dirPath);
  const configPath = `${configDir}/config.json`;
  await ensureDir(configDir);
  const content = JSON.stringify({ provider, apiKey });
  const result = await writeFile(configPath, content);
  if (result.startsWith("Error writing")) {
    throw new Error(result);
  }
  cachedConfig = { provider, apiKey };
}

/**
 * Gets cached auth config.
 * @returns Config or null.
 */
export function getConfig(): AuthConfig | null {
  return cachedConfig;
}
