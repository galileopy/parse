import { ReadlineService } from "./readline.service";
import readline from "readline";

describe("ReadlineService", () => {
  let mockedRl: jest.Mocked<readline.Interface>;

  beforeEach(() => {
    // Reset singleton for isolation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ReadlineService as any).instance = null;

    mockedRl = {
      prompt: jest.fn(),
      on: jest.fn().mockReturnThis(),
      question: jest.fn() as jest.MockedFunction<
        (query: string, callback: (answer: string) => void) => void
      >,
    } as unknown as jest.Mocked<readline.Interface>;

    // Mock createInterface
    jest.spyOn(readline, "createInterface").mockReturnValue(mockedRl);
  });

  it("creates and returns the same singleton instance", () => {
    const instance1 = ReadlineService.getInstance();
    const instance2 = ReadlineService.getInstance();
    expect(instance1).toBe(instance2);
    expect(readline.createInterface).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: "Parse > " })
    );
  });

  it("delegates prompt to internal rl", () => {
    const service = ReadlineService.getInstance();
    service.prompt();
    expect(mockedRl.prompt).toHaveBeenCalled();
  });

  it("delegates on to internal rl", () => {
    const service = ReadlineService.getInstance();
    const listener = jest.fn();
    service.on("line", listener);
    expect(mockedRl.on).toHaveBeenCalledWith("line", listener);
  });

  it("handles question async with trim", async () => {
    mockedRl.question.mockImplementation(((
      q: string,
      callback: (answer: string) => void
    ) => {
      callback(" y ");
    }) as unknown as readline.Interface["question"]);

    const service = ReadlineService.getInstance();
    const result = await service.question("Test? ");
    expect(result).toBe("y");
    expect(mockedRl.question).toHaveBeenCalledWith(
      "Test? ",
      expect.any(Function)
    );
  });
});
