// src/tools/file/index.test.ts
import { IFileOpsService } from "../../types";
import {
  CreateFileTool,
  DeleteFileTool,
  EditFileTool,
  FindFileTool,
  ListDirTool,
  ReadFileTool,
  RenameFileTool,
  TreeDirTool,
} from "./index";
import fs from "fs/promises";
import { ToolResponse } from "../../tools/tool-response";

jest.mock("fs/promises");

const setup = () => {
  const fileOpsService: jest.Mocked<IFileOpsService> = {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    ensureDir: jest.fn(),
    listDir: jest.fn(),
    renameFile: jest.fn(),
    deleteFile: jest.fn(),
  };
  return { fileOpsService };
};

describe("File Tools", () => {
  beforeEach(() => {
    (fs.stat as jest.Mock).mockReset();
  });

  describe("CreateFileTool", () => {
    const { fileOpsService } = setup();
    const tool = new CreateFileTool(fileOpsService);

    it("executes successfully", async () => {
      fileOpsService.writeFile.mockResolvedValue(
        "Write successful to file.txt."
      );
      const response = await tool.execute({
        path: "file.txt",
        content: "data",
      });

      expect(response).toBeInstanceOf(ToolResponse);
      expect(response.success).toBe(true);
      expect(response.errors).toEqual([]);
      expect(response.result).toEqual({
        path: "file.txt",
        message: "Write successful to file.txt.",
      });
      expect(response.version).toBe("1.0");
    });

    it("handles invalid args", async () => {
      const response = await tool.execute({ path: 123, content: "data" });
      expect(response.success).toBe(false);
      expect(response.errors[0].message).toBe(
        "Invalid arguments: path and content must be strings."
      );
      expect(response.errors[0].code).toBe("VALIDATION_ERROR");
      expect(response.result).toBe(null);
    });

    it("handles write error", async () => {
      fileOpsService.writeFile.mockResolvedValue(
        "Error writing to file.txt: ENOENT"
      );
      const response = await tool.execute({
        path: "file.txt",
        content: "data",
      });
      expect(response.success).toBe(false);
      expect(response.errors[0].message).toContain("Error writing");
      expect(response.errors[0].code).toBe("WRITE_ERROR");
      expect(response.result).toBe(null);
    });
  });

  describe("DeleteFileTool", () => {
    const { fileOpsService } = setup();
    const tool = new DeleteFileTool(fileOpsService);

    it("executes successfully", async () => {
      fileOpsService.deleteFile.mockResolvedValue(
        "Delete successful: file.txt."
      );
      const response = await tool.execute({ path: "file.txt" });
      expect(tool.requiresApproval).toBe(true);
      expect(response.success).toBe(true);
      expect(response.result).toEqual({
        path: "file.txt",
        message: "Delete successful: file.txt.",
      });
      expect(response.description).toContain("no error on missing files");
    });

    it("handles invalid args", async () => {
      const response = await tool.execute({ path: 123 });
      expect(response.success).toBe(false);
      expect(response.errors[0].message).toBe(
        "Invalid argument: path must be string."
      );
      expect(response.errors[0].code).toBe("VALIDATION_ERROR");
    });

    it("handles delete error", async () => {
      fileOpsService.deleteFile.mockResolvedValue(
        "Error deleting file.txt: EACCES"
      );
      const response = await tool.execute({ path: "file.txt" });
      expect(response.success).toBe(false);
      expect(response.errors[0].message).toContain("Error deleting");
      expect(response.errors[0].code).toBe("DELETE_ERROR");
    });
  });

  describe("EditFileTool", () => {
    const { fileOpsService } = setup();
    const tool = new EditFileTool(fileOpsService);

    it("appends content successfully", async () => {
      fileOpsService.readFile.mockResolvedValue("existing");
      fileOpsService.writeFile.mockResolvedValue(
        "Write successful to file.txt."
      );
      const response = await tool.execute({
        path: "file.txt",
        content: " new",
        mode: "append",
      });
      expect(tool.requiresApproval).toBe(true);
      expect(response.success).toBe(true);
      expect(response.result).toEqual({
        path: "file.txt",
        mode: "append",
        message: "Write successful to file.txt.",
      });
    });

    it("handles file not found", async () => {
      fileOpsService.readFile.mockResolvedValue("File not found: missing.txt");
      const response = await tool.execute({
        path: "missing.txt",
        content: "new",
        mode: "replace",
      });
      expect(response.success).toBe(false);
      expect(response.errors[0].code).toBe("FILE_NOT_FOUND");
    });

    it("handles invalid args", async () => {
      const response = await tool.execute({
        path: "file.txt",
        content: "new",
        mode: 123,
      });
      expect(response.success).toBe(false);
      expect(response.errors[0].message).toBe("Invalid arguments.");
    });
  });

  describe("FindFileTool", () => {
    const { fileOpsService } = setup();
    const tool = new FindFileTool(fileOpsService);

    it("finds matches successfully", async () => {
      fileOpsService.listDir.mockResolvedValue(["test.txt", "other.doc"]);
      const response = await tool.execute({ path: ".", name: "test" });
      expect(response.success).toBe(true);
      expect(response.result).toEqual({ matches: ["test.txt"] });
      expect(response.description).toContain("Files found");
    });

    it("handles no matches", async () => {
      fileOpsService.listDir.mockResolvedValue(["other.doc"]);
      const response = await tool.execute({ path: ".", name: "test" });
      expect(response.success).toBe(true); // Valid outcome
      expect(response.result).toEqual({ matches: [] });
      expect(response.description).toContain(
        "No files found; this is a valid outcome"
      );
    });

    it("handles error", async () => {
      fileOpsService.listDir.mockRejectedValue(new Error("Dir error"));
      const response = await tool.execute({ path: "/invalid", name: "test" });
      expect(response.success).toBe(false);
      expect(response.errors[0].code).toBe("LIST_ERROR");
    });

    it("handles invalid args", async () => {
      const response = await tool.execute({ path: ".", name: 123 });
      expect(response.success).toBe(false);
      expect(response.errors[0].code).toBe("VALIDATION_ERROR");
    });
  });

  describe("ListDirTool", () => {
    const { fileOpsService } = setup();
    const tool = new ListDirTool(fileOpsService);

    it("executes successfully", async () => {
      fileOpsService.listDir.mockResolvedValue(["file1.txt", "file2.txt"]);
      const response = await tool.execute({ path: "." });
      expect(response.success).toBe(true);
      expect(response.result).toEqual({ files: ["file1.txt", "file2.txt"] });
    });

    it("handles empty dir", async () => {
      fileOpsService.listDir.mockResolvedValue([]);
      const response = await tool.execute({ path: "." });
      expect(response.success).toBe(true);
      expect(response.result).toEqual({ files: [] });
      expect(response.description).toContain("Empty directory");
    });

    it("handles error", async () => {
      fileOpsService.listDir.mockRejectedValue(new Error("Dir error"));
      const response = await tool.execute({ path: "/invalid" });
      expect(response.success).toBe(false);
      expect(response.errors[0].code).toBe("LIST_ERROR");
    });

    it("handles invalid args", async () => {
      const response = await tool.execute({ path: 123 });
      expect(response.success).toBe(false);
      expect(response.errors[0].code).toBe("VALIDATION_ERROR");
    });
  });

  describe("RenameFileTool", () => {
    const { fileOpsService } = setup();
    const tool = new RenameFileTool(fileOpsService);

    it("executes successfully", async () => {
      fileOpsService.renameFile.mockResolvedValue(
        "Rename successful: old.txt to new.txt."
      );
      const response = await tool.execute({
        old_path: "old.txt",
        new_path: "new.txt",
      });
      expect(tool.requiresApproval).toBe(true);
      expect(response.success).toBe(true);
      expect(response.result).toEqual({
        old_path: "old.txt",
        new_path: "new.txt",
        message: "Rename successful: old.txt to new.txt.",
      });
    });

    it("handles error", async () => {
      fileOpsService.renameFile.mockResolvedValue(
        "Error renaming old.txt to new.txt: ENOENT"
      );
      const response = await tool.execute({
        old_path: "old.txt",
        new_path: "new.txt",
      });
      expect(response.success).toBe(false);
      expect(response.errors[0].code).toBe("RENAME_ERROR");
    });

    it("handles invalid args", async () => {
      const response = await tool.execute({
        old_path: "old.txt",
        new_path: 123,
      });
      expect(response.success).toBe(false);
      expect(response.errors[0].code).toBe("VALIDATION_ERROR");
    });
  });

  describe("TreeDirTool", () => {
    const { fileOpsService } = setup();
    const tool = new TreeDirTool(fileOpsService);

    it("executes successfully with nested dirs", async () => {
      fileOpsService.listDir
        .mockResolvedValueOnce(["subdir", "file.txt"])
        .mockResolvedValueOnce(["nested.txt"]);
      (fs.stat as jest.Mock)
        .mockResolvedValueOnce({ isDirectory: () => true })
        .mockResolvedValueOnce({ isDirectory: () => false })
        .mockResolvedValueOnce({ isDirectory: () => false });
      const response = await tool.execute({ path: "." });
      expect(response.success).toBe(true);
      expect((response.result as { tree: string }).tree).toContain("subdir");
      expect((response.result as { tree: string }).tree).toContain(
        "nested.txt"
      );
    });

    it("handles empty dir", async () => {
      fileOpsService.listDir.mockResolvedValue([]);
      const response = await tool.execute({ path: "." });
      expect(response.success).toBe(true);
      expect((response.result as { tree: string }).tree).toBe("");
      expect(response.description).toContain("Empty directory tree");
    });

    it("handles error", async () => {
      fileOpsService.listDir.mockRejectedValue(new Error("Dir error"));
      const response = await tool.execute({ path: "/invalid" });
      expect(response.success).toBe(false);
      expect(response.errors[0].code).toBe("TREE_ERROR");
    });

    it("handles invalid args", async () => {
      const response = await tool.execute({ path: 123 });
      expect(response.success).toBe(false);
      expect(response.errors[0].code).toBe("VALIDATION_ERROR");
    });
  });

  describe("ReadFileTool", () => {
    const { fileOpsService } = setup();
    const tool = new ReadFileTool(fileOpsService);

    it("executes successfully", async () => {
      fileOpsService.readFile.mockResolvedValue("test content");
      const response = await tool.execute({ path: "file.txt" });
      expect(response.success).toBe(true);
      expect(response.result).toEqual({ content: "test content" });
      expect(response.description).toBe("File content read successfully.");
    });

    it("handles file not found error", async () => {
      fileOpsService.readFile.mockResolvedValue("File not found: missing.txt");
      const response = await tool.execute({ path: "missing.txt" });
      expect(response.success).toBe(false);
      expect(response.errors[0].code).toBe("FILE_NOT_FOUND");
    });

    it("handles invalid args", async () => {
      const response = await tool.execute({ path: 123 });
      expect(response.success).toBe(false);
      expect(response.errors[0].code).toBe("VALIDATION_ERROR");
    });
  });
});
