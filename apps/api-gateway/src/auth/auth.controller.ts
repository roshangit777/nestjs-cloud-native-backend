import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { RpcException } from "@nestjs/microservices";
/* import { LoginThrottlerGuard } from "./guards/login-throttler.guard"; */
import { AuthGuard } from "./../../../common/guards/auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { RolesGuard } from "./../../../common/guards/roles.guard";
import { RegisterUserDto } from "./dto/register.dto";
import { LoginUserDto } from "./dto/login.dto";
/* import { LoginHistory } from "apps/events/entity/login-history.entity"; */
import type { Request, Response } from "express";
import { lastValueFrom } from "rxjs";
import type {
  AdminLoginToken,
  CurrentUserInfo,
  LoginToken,
} from "./interfaces/LoginToken.interface";
import { LoginThrottlerGuard } from "apps/common/guards/login-throttler.guard";
import { withCorrelation } from "apps/common/grpc/grpc-metadata";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

@Controller("auth")
export class AuthController implements OnModuleInit {
  private authServices: any;
  constructor(@Inject("AUTH_CLIENT") private authClient: ClientGrpc) {}

  onModuleInit() {
    this.authServices = this.authClient.getService("AuthService");
  }

  @Post("user/register")
  registerUser(@Body() data: RegisterUserDto) {
    return this.authServices.UserRegister(data);
  }

  /* @UseGuards(LoginThrottlerGuard) */
  @Post("user/login")
  @UseGuards(LoginThrottlerGuard)
  async userLogin(
    @Body() data: LoginUserDto,
    @Res({ passthrough: true }) res: Response
  ) {
    let token: LoginToken = await lastValueFrom(
      this.authServices.UserLogin(data, withCorrelation())
    );
    res.cookie("refresh_token", token.refreshToken, {
      httpOnly: true, // can't be accessed by JS
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    return {
      message: "Logged in successfull",
      access_token: token.accessToken,
      user: token.user,
    };
  }

  @UseGuards(AuthGuard)
  @Get("profile")
  getProfile(
    @CurrentUser()
    user: CurrentUserInfo
  ) {
    return {
      name: user.name,
      id: user.sub,
      email: user.email,
      role: user.role,
    };
  }

  @Get("/refresh")
  async refreshToken(@Req() req: Request) {
    const token = req.cookies?.["refresh_token"];
    if (!token) {
      throw new RpcException({
        status: 404,
        message: "Refresh token not found",
      });
    }
    const result: { accessToken: string } = await lastValueFrom(
      this.authServices.Refresh({ token })
    );

    return {
      message: "access_token refreshed successfully",
      access_token: result.accessToken,
    };
  }

  @Post("admin/register")
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  createAdmin(@Body() data: RegisterUserDto) {
    return this.authServices.AdminRegister(data);
  }

  @Post("admin/login")
  @UseGuards(LoginThrottlerGuard)
  async adminLogin(
    @Body() data: LoginUserDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const token: AdminLoginToken = await lastValueFrom(
      this.authServices.AdminLogin(data)
    );
    //Set cookie securely
    res.cookie("refresh_token", token.refreshToken, {
      httpOnly: true, // can't be accessed by JS
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return {
      message: "Logged in successfull",
      access_token: token.accessToken,
      admin: token.admin,
    };
  }

  @UseGuards(AuthGuard)
  @Post("logout")
  allLogout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("refresh_token");
    return { message: "Logged out successfully" };
  }

  @UseGuards(AuthGuard)
  @Post("add-user")
  addNewUserType(@Body() data: string) {
    return this.authServices.NewUserType({ type: data });
  }
}
