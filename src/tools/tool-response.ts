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
    this.name = params.name;
    this.success = params.success;
    this.errors = params.errors || [];
    this.result = params.result;
    this.description = params.description;
    this.version = params.version || "1.0";

    // Validate that the result is serializable
    try {
      JSON.stringify(this.result);
    } catch {
      throw new Error("Result must be JSON serializable.");
    }
  }
}
