import { Controller } from "@nestjs/common";
import { LoginHistoryModuleService } from "./login-history.module.service";
import { GrpcMethod, Payload } from "@nestjs/microservices";
import type { UserDetails } from "./interfaces/userDetails.interface";

@Controller()
export class LoginHistoryModuleController {
  constructor(
    private readonly LoginHistorymoduleService: LoginHistoryModuleService
  ) {}

  @GrpcMethod("loginHistory", "AddLoginHistory")
  createHistory(@Payload() data: UserDetails) {
    this.LoginHistorymoduleService.recordLogin(data);
    return { message: "done" };
  }

  @GrpcMethod("loginHistory", "GetAllLoginHistory")
  async getAllHistory() {
    const result =
      await this.LoginHistorymoduleService.getAllUserLoginHistory();
    return { history: result };
  }

  @GrpcMethod("loginHistory", "GetOneLoginHistory")
  async getOneHistory(@Payload() userId: { id: number }) {
    const result = await this.LoginHistorymoduleService.getOneUserLoginHistory(
      userId.id
    );
    return { result };
  }
}
