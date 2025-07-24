export interface ToolResponseData {
  name: string;
  success: boolean;
  errors?: { message: string; code?: string }[];
  result: unknown;
  description?: string;
  version?: string;
}

export class ToolResponse {
  public readonly name: string;
  public readonly success: boolean;
  public readonly errors: { message: string; code?: string }[];
  public readonly result: unknown;
  public readonly description?: string;
  public readonly version: string;

  constructor(params: ToolResponseData) {
    // Validate that the result is serializable
    if (params.result !== null) {
      try {
        JSON.stringify(params.result, this.replacer);
      } catch {
        throw new Error("Result must be JSON serializable.");
      }
    }
    this.name = params.name;
    this.success = params.success;
    this.errors = params.errors || [];
    this.result = params.result;
    this.description = params.description;
    this.version = params.version || "1.0";
  }
  replacer = (key: unknown, value: unknown) => {
    if (
      typeof key === "function" ||
      typeof key === "symbol" ||
      typeof key === "undefined"
    ) {
      throw new Error("Non-serializable key detected.");
    }
    if (
      typeof value === "function" ||
      typeof value === "symbol" ||
      typeof value === "undefined"
    ) {
      throw new Error("Non-serializable value detected.");
    }
    return value;
  };
}
