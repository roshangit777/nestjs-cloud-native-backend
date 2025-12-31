import { Inject, Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Users /* UserRole */ } from "./entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { RegisterUserDto } from "./dto/register.dto";
import * as bcrypt from "bcrypt";
import { LoginUserDto } from "./dto/login.dto";
import { JwtService } from "@nestjs/jwt";
import type { ClientProxy } from "@nestjs/microservices";
import { RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";
import { Roles } from "./entities/roles.entity";
import { UserRoleMap } from "./entities/user-role-map.entity";
/* import { LoginHistory } from 'src/events/entity/login-history.entity'; */

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users) private userRepository: Repository<Users>,
    @InjectRepository(Roles) private rolesRepository: Repository<Roles>,
    @InjectRepository(UserRoleMap)
    private userRoleMapRepository: Repository<UserRoleMap>,
    private jwtService: JwtService,
    @Inject("LOGIN_HISTORY_RMQ") private loginHistroryClient: ClientProxy,
    @Inject("NOTIFICATION_RECORD_RMQ") private notificationClient: ClientProxy
  ) {}

  async userRegister(userData: RegisterUserDto) {
    const existUser = await this.userRepository.findOne({
      where: { email: userData.email },
    });
    if (existUser) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        details: "User alredy exist",
      });
    }
    const user = this.userRepository.create({
      name: userData.name,
      email: userData.email,
      password: await this.hashPassword(userData.password),
    });
    await this.userRepository.save(user);

    const role = await this.rolesRepository.findOne({
      where: { roleName: "user" },
    });

    const userRoleMapping = this.userRoleMapRepository.create({
      user: { id: user.id },
      role: { id: role?.id },
    });

    await this.userRoleMapRepository.save(userRoleMapping);

    const { password, ...result } = user;
    return {
      message: "Register is completed",
      user: result,
    };
  }

  async adminRegister(userData: RegisterUserDto) {
    const existUser = await this.userRepository.findOne({
      where: { email: userData.email },
    });
    if (existUser) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: "Email alredy exist use a different email",
      });
    }
    const admin = this.userRepository.create({
      name: userData.name,
      email: userData.email,
      password: await this.hashPassword(userData.password),
    });

    await this.userRepository.save(admin);

    const role = await this.rolesRepository.findOne({
      where: { roleName: "admin" },
    });

    const adminRoleMapping = this.userRoleMapRepository.create({
      user: { id: admin.id },
      role: { id: role?.id },
    });

    await this.userRoleMapRepository.save(adminRoleMapping);

    const { password, ...result } = admin;
    return {
      message: "Register is completed",
      user: result,
    };
  }

  async loginUser(userData: LoginUserDto) {
    const user = await this.userRepository.findOne({
      where: { email: userData.email },
      relations: ["roles", "roles.role"],
    });

    if (
      !user ||
      !(await this.comparePasswords(userData.password, user.password))
    ) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: "Email or password is invalid",
      });
    }

    const roles = user?.roles.map((item) => item.role.roleName);

    const payload = {
      name: user.name,
      sub: user.id,
      email: user.email,
      role: roles,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: "90m",
    });
    const refreshToken = await this.jwtService.signAsync(
      { id: payload.sub },
      {
        expiresIn: "1d",
      }
    );

    const loginData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: roles,
    };
    this.loginHistroryClient.emit("record_login", loginData);
    /* this.loginHistroryClient.emit("history.create", user.id).subscribe({
      next: (res) => console.log("Login recorded:", res),
      error: (err) => console.error("Error recording login:", err),
    }); */
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles,
      },
    };
  }

  async refreshAndSetToken(token: string) {
    const secret = "jwtsecret";
    const result = await this.jwtService.verify(token, {
      secret,
    });
    const user = await this.userRepository.findOne({
      where: { id: result.id },
      relations: ["roles", "roles.role"],
    });

    if (!user) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: "User not found for Token Refresh",
      });
    }

    const roles = user.roles.map((item) => item.role.roleName);

    const payload = {
      name: user.name,
      sub: user.id,
      email: user.email,
      role: roles,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: "90m",
    });
    return { accessToken };
  }

  async loginAdmin(userData: LoginUserDto) {
    const user = await this.userRepository.findOne({
      where: { email: userData.email },
      relations: ["roles", "roles.role"],
    });

    if (
      !user ||
      !(await this.comparePasswords(userData.password, user.password))
    ) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: "Email or password is invalid",
      });
    }

    const roles = user?.roles.map((item) => item.role.roleName);

    if (!roles?.includes("admin")) {
      {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: "Insufficient permission",
        });
      }
    }

    const payload = {
      name: user.name,
      sub: user.id,
      email: user.email,
      role: roles,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: "90m",
    });
    const refreshToken = await this.jwtService.signAsync(
      { id: user.id },
      { expiresIn: "7d" }
    );
    //save for login history
    const loginData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: roles,
    };
    this.loginHistroryClient.emit("record_login", loginData);
    this.notificationClient.emit("record_notification", user.id);
    return {
      accessToken,
      refreshToken,
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles,
      },
    };
  }

  async addUserType(userType: string) {
    const newUserType = this.rolesRepository.create({
      roleName: userType,
    });

    await this.rolesRepository.save(newUserType);
    return { message: `New user type called ${userType} created successfully` };
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10); // hashes the plain password
  }

  private async comparePasswords(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

/* const newPayload = { sub: 2, email: 'r1@gmail.com', role: 'admin' }; */
/* console.log('password:', await this.hashPassword(userData.password));
    console.log('token:', await this.jwtService.signAsync(newPayload)); */
