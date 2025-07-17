import { FileOpsService } from "./file-ops";
import fs from "fs/promises";
import os from "os";
import path from "path";

describe("FileOpsService", () => {
  const service = new FileOpsService();
  const testDir = path.join(os.tmpdir(), "parse-test-dir");
  const testPath = path.join(testDir, "test.txt");

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("reads non-existent file", async () => {
    expect(await service.readFile("missing.txt")).toBe(
      "File not found: missing.txt"
    );
  });

  it("handles empty path in read", async () => {
    expect(await service.readFile("")).toBe("Invalid empty path.");
  });

  it("writes and reads file", async () => {
    await service.ensureDir(testDir);
    const writeResult = await service.writeFile(testPath, "test content");
    expect(writeResult).toBe(`Write successful to ${testPath}.`);
    const readResult = await service.readFile(testPath);
    expect(readResult).toBe("test content");
  });

  it("handles empty content in write", async () => {
    expect(await service.writeFile(testPath, "")).toBe(
      "Invalid empty content."
    );
  });

  it("ensures directory exists and handles errors", async () => {
    await expect(service.ensureDir("")).rejects.toThrow(
      "Invalid empty directory path."
    );
    await service.ensureDir(testDir);
    // Check access resolves without error (dir exists, returns undefined)
    expect(fs.access(testDir)).resolves.toBeUndefined();
  });
});
