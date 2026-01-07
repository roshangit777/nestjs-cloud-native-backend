import { Controller } from "@nestjs/common";
import { LoginHistoryModuleService } from "./login-history.module.service";
import { GrpcMethod, MessagePattern, Payload } from "@nestjs/microservices";
import type { UserDetails } from "./interfaces/userDetails.interface";
import { asyncContext } from "apps/common/context/async-context";

@Controller()
export class LoginHistoryModuleController {
  constructor(
    private readonly LoginHistorymoduleService: LoginHistoryModuleService
  ) {}

  /* @GrpcMethod("loginHistory", "AddLoginHistory") */
  @MessagePattern("record_login")
  createHistory(@Payload() payload: any) {
    const { data, correlationId } = payload;

    asyncContext.run({ correlationId }, () => {
      this.LoginHistorymoduleService.recordLogin(data);
    });
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
