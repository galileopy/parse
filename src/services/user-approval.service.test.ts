import { UserApprovalService } from "./user-approval.service";
import { IReadlineService } from "../types";

describe("UserApprovalService", () => {
  let mockedReadlineService: jest.Mocked<IReadlineService>;
  let service: UserApprovalService;

  beforeEach(() => {
    mockedReadlineService = {
      question: jest.fn().mockResolvedValue("y"),
    } as unknown as jest.Mocked<IReadlineService>;
    service = new UserApprovalService(mockedReadlineService);
  });

  it("delegates approval to readline service question", async () => {
    const question = "Approve? (y/n): ";
    mockedReadlineService.question.mockResolvedValue(" y ");

    const result = await service.getApproval(question);
    expect(result).toBe(" y ");
    expect(mockedReadlineService.question).toHaveBeenCalledWith(question);
  });

  it("handles empty response from service", async () => {
    mockedReadlineService.question.mockResolvedValue("");
    const result = await service.getApproval("Test?");
    expect(result).toBe("");
  });
});
