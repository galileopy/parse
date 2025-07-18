import { FileOpsService } from "./file-ops";
import fs from "fs/promises";
import os from "os";
import path from "path";

describe("FileOpsService", () => {
  const service = new FileOpsService();
  const testDir = path.join(os.tmpdir(), "parse-test-dir");
  const testPath = path.join(testDir, "test.txt");

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("reads non-existent file", async () => {
    expect(await service.readFile("missing.txt")).toContain("File not found");
  });

  it("handles empty path in read", async () => {
    expect(await service.readFile("")).toBe("Invalid empty path.");
  });

  it("writes and reads file", async () => {
    const writeResult = await service.writeFile(testPath, "test content");
    expect(writeResult).toContain("Write successful");
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
    expect(fs.access(testDir)).resolves.toBeUndefined();
  });

  it("lists directory", async () => {
    await fs.writeFile(testPath, "content");
    const files = await service.listDir(testDir);
    expect(files).toEqual(["test.txt"]);
  });

  it("handles error in listDir", async () => {
    await expect(service.listDir("/invalid")).rejects.toThrow("Error listing");
  });

  it("renames file", async () => {
    await fs.writeFile(testPath, "content");
    const newPath = path.join(testDir, "new.txt");
    const result = await service.renameFile(testPath, newPath);
    expect(result).toContain("Rename successful");
    await expect(fs.access(testPath)).rejects.toThrow();
    await expect(fs.access(newPath)).resolves.toBeUndefined();
  });

  it("handles error in rename", async () => {
    const result = await service.renameFile("missing.txt", "new.txt");
    expect(result).toContain("Error renaming");
  });

  it("deletes file", async () => {
    await fs.writeFile(testPath, "content");
    const result = await service.deleteFile(testPath);
    expect(result).toContain("Delete successful");
    await expect(fs.access(testPath)).rejects.toThrow();
  });

  it("handles error in delete", async () => {
    const result = await service.deleteFile("missing.txt");
    expect(result).toContain("Delete successful"); // force: true allows no-error on missing
  });
});
