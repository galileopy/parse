import os from "os";
import {
  AuthConfig,
  IConfigService,
  IFileOpsService,
  ILoggerService,
} from "./types"; // Add ILoggerService import

export class ConfigService implements IConfigService {
  private cachedConfig: AuthConfig | null = null;
  private readonly DEFAULT_MODEL = "grok-3-mini";

  constructor(
    private fileOpsService: IFileOpsService,
    private logger: ILoggerService 
  ) {}

  getDefaultModel(): string {
    return this.DEFAULT_MODEL;
  }

  getConfigDir(dirPath?: string): string {
    return dirPath ?? `${os.homedir()}/.parse`;
  }

  private async validateApiKey(apiKey: string): Promise<void> {
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

  async loadConfig(dirPath?: string): Promise<void> {
    const configDir = this.getConfigDir(dirPath);
    const configPath = `${configDir}/config.json`;
    const data = await this.fileOpsService.readFile(configPath);
    if (data.startsWith("File not found") || data.startsWith("Error reading")) {
      this.cachedConfig = null;
      throw new Error(`Config not found: ${data}`);
    }
    try {
      const config = JSON.parse(data) as AuthConfig;
      await this.validateApiKey(config.apiKey);
      this.cachedConfig = config;
    } catch (parseErr: unknown) {
      this.cachedConfig = null;
      const errMsg = `Invalid config: ${(parseErr as Error).message}`;
      this.logger.error(errMsg); // New: Log parse errors
      throw new Error(errMsg);
    }
  }

  async saveConfig(
    provider: string,
    apiKey: string,
    dirPath?: string,
    _preferredModel?: string
  ): Promise<void> {
    if (provider.trim() === "" || apiKey.trim() === "") {
      throw new Error("Invalid provider or apiKey.");
    }
    const preferredModel =
      _preferredModel ??
      this.cachedConfig?.preferredModel ??
      this.DEFAULT_MODEL;

    await this.validateApiKey(apiKey);
    const configDir = this.getConfigDir(dirPath);
    const configPath = `${configDir}/config.json`;

    await this.fileOpsService.ensureDir(configDir);

    const content = JSON.stringify({ provider, apiKey, preferredModel });
    const result = await this.fileOpsService.writeFile(configPath, content);

    if (result.startsWith("Error writing")) {
      this.logger.error(result); // New: Log write errors
      throw new Error(result);
    }

    this.cachedConfig = { provider, apiKey, preferredModel };
  }

  getConfig(): AuthConfig | null {
    return this.cachedConfig;
  }
}
