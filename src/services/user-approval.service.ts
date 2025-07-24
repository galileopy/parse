import { IReadlineService, IUserApprovalService } from "../types";

export class UserApprovalService implements IUserApprovalService {
  constructor(private readlineService: IReadlineService) {}

  async getApproval(question: string): Promise<string> {
    return this.readlineService.question(question);
  }
}
