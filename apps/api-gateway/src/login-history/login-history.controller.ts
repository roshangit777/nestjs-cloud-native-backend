import {
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Param,
  UseGuards,
} from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { Roles } from "apps/common/decorators/roles.decorator";
import { AuthGuard } from "apps/common/guards/auth.guard";
import { RolesGuard } from "apps/common/guards/roles.guard";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

@Controller("login-history")
export class LoginHistoryController implements OnModuleInit {
  private loginHistoryService: any;
  constructor(
    @Inject("LOGIN_HISTORY_CLIENT") private loginHistroyClient: ClientGrpc
  ) {}

  onModuleInit() {
    this.loginHistoryService =
      this.loginHistroyClient.getService("loginHistory");
  }

  /*  @Post("create")
  createLoginHistory(@Body() data: UserDetails) {
    this.loginHistroyClient.send("history.create", data);
  } */

  @Get("user-history")
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  getAllUserLoginHistory() {
    return this.loginHistoryService.GetAllLoginHistory({});
  }

  @Get("user-history/:id")
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  getOneUserLoginHistory(@Param("id") id: number) {
    return this.loginHistoryService.GetOneLoginHistory({
      id: Number(id),
    });
  }
}
