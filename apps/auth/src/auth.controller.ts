import { Controller } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterUserDto } from "./dto/register.dto";
import { LoginUserDto } from "./dto/login.dto";
/* import { LoginHistory } from "apps/events/entity/login-history.entity"; */
import { GrpcMethod, Payload } from "@nestjs/microservices";
import { Metadata } from "@grpc/grpc-js";

@Controller()
export class AuthController {
  constructor(private readonly authServices: AuthService) {}

  @GrpcMethod("AuthService", "UserRegister")
  async registerUser(@Payload() data: RegisterUserDto) {
    return await this.authServices.userRegister(data);
  }

  @GrpcMethod("AuthService", "AdminRegister")
  async createAdmin(@Payload() data: RegisterUserDto) {
    return await this.authServices.adminRegister(data);
  }

  @GrpcMethod("AuthService", "UserLogin")
  async userLogin(@Payload() data: LoginUserDto) {
    return await this.authServices.loginUser(data);
  }

  @GrpcMethod("AuthService", "AdminLogin")
  async adminLogin(@Payload() data: LoginUserDto) {
    return await this.authServices.loginAdmin(data);
  }

  @GrpcMethod("AuthService", "Refresh")
  async refreshToken(@Payload() data: { token: string }) {
    return await this.authServices.refreshAndSetToken(data.token);
  }

  @GrpcMethod("AuthService", "NewUserType")
  async addUserTypeHandle(@Payload() data: { type: string }) {
    return this.authServices.addUserType(data.type);
  }
}
