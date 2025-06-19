export function formatErrorLog(
  error: string,
  operationId: string,
  timestamp: string
): string {
  return `Error [${operationId}]: ${error} at ${timestamp}\n`;
}

export function getErrorLogPath(timestamp: string): string {
  const formatted = timestamp.replace(/[-:T.Z]/g, "");
  return `~/.parse/error.log.${formatted}`;
}
