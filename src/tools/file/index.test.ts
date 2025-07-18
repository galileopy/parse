import { IFileOpsService } from "../../types";
import {
  CreateFileTool,
  EditFileTool,
  ListDirTool,
  FindFileTool,
  RenameFileTool,
  DeleteFileTool,
  TreeDirTool,
} from "./index";
import fs from "fs/promises";

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
      fileOpsService.writeFile.mockResolvedValue("Success");
      expect(await tool.execute({ path: "file.txt", content: "data" })).toBe(
        "Success"
      );
    });

    it("handles invalid args", async () => {
      expect(await tool.execute({ path: 123, content: "data" })).toBe(
        "Invalid arguments: path and content must be strings."
      );
    });
  });

  describe("EditFileTool", () => {
    const { fileOpsService } = setup();
    const tool = new EditFileTool(fileOpsService);

    it("appends content", async () => {
      fileOpsService.readFile.mockResolvedValue("existing");
      fileOpsService.writeFile.mockResolvedValue("Success");
      expect(
        await tool.execute({
          path: "file.txt",
          content: " new",
          mode: "append",
        })
      ).toBe("Success");
      expect(fileOpsService.writeFile).toHaveBeenCalledWith(
        "file.txt",
        "existing new"
      );
    });

    it("replaces content", async () => {
      fileOpsService.readFile.mockResolvedValue("existing");
      fileOpsService.writeFile.mockResolvedValue("Success");
      expect(
        await tool.execute({
          path: "file.txt",
          content: "new",
          mode: "replace",
        })
      ).toBe("Success");
      expect(fileOpsService.writeFile).toHaveBeenCalledWith("file.txt", "new");
    });

    it("handles read error", async () => {
      fileOpsService.readFile.mockResolvedValue("File not found: missing.txt");
      expect(
        await tool.execute({
          path: "missing.txt",
          content: "new",
          mode: "replace",
        })
      ).toBe("File not found: missing.txt");
    });

    it("handles invalid args", async () => {
      expect(
        await tool.execute({ path: "file.txt", content: "new", mode: 123 })
      ).toBe("Invalid arguments.");
    });
  });

  describe("ListDirTool", () => {
    const { fileOpsService } = setup();
    const tool = new ListDirTool(fileOpsService);

    it("executes successfully", async () => {
      fileOpsService.listDir.mockResolvedValue(["file1.txt", "file2.txt"]);
      expect(await tool.execute({ path: "." })).toBe(
        "Files in .:\nfile1.txt\nfile2.txt"
      );
    });

    it("handles error", async () => {
      fileOpsService.listDir.mockRejectedValue(new Error("Dir error"));
      expect(await tool.execute({ path: "/invalid" })).toBe("Dir error");
    });

    it("handles invalid args", async () => {
      expect(await tool.execute({ path: 123 })).toBe(
        "Invalid argument: path must be string."
      );
    });
  });

  describe("FindFileTool", () => {
    const { fileOpsService } = setup();
    const tool = new FindFileTool(fileOpsService);

    it("finds matches", async () => {
      fileOpsService.listDir.mockResolvedValue(["test.txt", "other.doc"]);
      expect(await tool.execute({ path: ".", name: "test" })).toBe(
        "Found:\ntest.txt"
      );
    });

    it("no matches", async () => {
      fileOpsService.listDir.mockResolvedValue(["other.doc"]);
      expect(await tool.execute({ path: ".", name: "test" })).toBe(
        "No matches found."
      );
    });

    it("handles error", async () => {
      fileOpsService.listDir.mockRejectedValue(new Error("Dir error"));
      expect(await tool.execute({ path: "/invalid", name: "test" })).toBe(
        "Dir error"
      );
    });

    it("handles invalid args", async () => {
      expect(await tool.execute({ path: ".", name: 123 })).toBe(
        "Invalid arguments."
      );
    });
  });

  describe("RenameFileTool", () => {
    const { fileOpsService } = setup();
    const tool = new RenameFileTool(fileOpsService);

    it("executes successfully", async () => {
      fileOpsService.renameFile.mockResolvedValue("Success");
      expect(
        await tool.execute({ old_path: "old.txt", new_path: "new.txt" })
      ).toBe("Success");
    });

    it("handles invalid args", async () => {
      expect(await tool.execute({ old_path: "old.txt", new_path: 123 })).toBe(
        "Invalid arguments."
      );
    });
  });

  describe("DeleteFileTool", () => {
    const { fileOpsService } = setup();
    const tool = new DeleteFileTool(fileOpsService);

    it("executes successfully", async () => {
      fileOpsService.deleteFile.mockResolvedValue("Success");
      expect(await tool.execute({ path: "file.txt" })).toBe("Success");
    });

    it("handles invalid args", async () => {
      expect(await tool.execute({ path: 123 })).toBe(
        "Invalid argument: path must be string."
      );
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
      const result = await tool.execute({ path: "." });
      expect(result).toBe(
        "Tree for .:\n├── subdir\n│   └── nested.txt\n└── file.txt\n"
      );
    });

    it("handles empty dir", async () => {
      fileOpsService.listDir.mockResolvedValue([]);
      const result = await tool.execute({ path: "." });
      expect(result).toBe("Tree for .:\n");
    });

    it("handles error", async () => {
      fileOpsService.listDir.mockRejectedValue(new Error("Dir error"));
      expect(await tool.execute({ path: "/invalid" })).toBe("Dir error");
    });

    it("handles invalid args", async () => {
      expect(await tool.execute({ path: 123 })).toBe(
        "Invalid argument: path must be string."
      );
    });
  });
});
