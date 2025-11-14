import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { Repository } from "typeorm";
import { Users, UserRole } from "./entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { RegisterUserDto } from "./dto/register.dto";
import * as bcrypt from "bcrypt";
import { LoginUserDto } from "./dto/login.dto";
import { JwtService } from "@nestjs/jwt";
import type { ClientGrpc } from "@nestjs/microservices";
import { RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";
/* import { LoginHistory } from 'src/events/entity/login-history.entity'; */

@Injectable()
export class AuthService implements OnModuleInit {
  private loginHistoryServices: any;

  constructor(
    @InjectRepository(Users) private userRepository: Repository<Users>,
    private jwtService: JwtService,
    /* private readonly userEventService: UserEventsService, */
    @Inject("LOGIN_HISTORY_CLIENT") private loginHistroryClient: ClientGrpc
  ) {}

  onModuleInit() {
    this.loginHistoryServices =
      this.loginHistroryClient.getService("loginHistory");
  }

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
      ...userData,
      role: UserRole.USER,
      password: await this.hashPassword(userData.password),
    });
    await this.userRepository.save(user);

    //emit the user registere event
    /*  this.userEventService.emitUserRegistered(user); */

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
      ...userData,
      role: UserRole.ADMIN,
      password: await this.hashPassword(userData.password),
    });

    await this.userRepository.save(admin);
    const { password, ...result } = admin;
    return {
      message: "Register is completed",
      user: result,
    };
  }

  async loginUser(userData: LoginUserDto) {
    const user = await this.userRepository.findOne({
      where: { email: userData.email },
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
    const payload = {
      name: user.name,
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    /*  await this.userEventService.recordLogin(user.id); */
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: "30m",
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
      role: user.role,
    };
    this.loginHistoryServices.AddLoginHistory(loginData);

    /* this.loginHistroryClient.emit("history.create", user.id).subscribe({
      next: (res) => console.log("Login recorded:", res),
      error: (err) => console.error("Error recording login:", err),
    }); */
    return { accessToken, refreshToken };
  }

  async refreshAndSetToken(token: string) {
    const secret = "jwtsecret";
    const result = await this.jwtService.verify(token, {
      secret,
    });
    const user = await this.userRepository.findOne({
      where: { id: result.id },
    });

    if (!user) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: "User not found for Token Refresh",
      });
    }
    const payload = {
      name: user.name,
      sub: user.id,
      email: user.email,
      role: user?.role,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: "30m",
    });
    return { accessToken };
  }

  async loginAdmin(userData: LoginUserDto) {
    const user = await this.userRepository.findOne({
      where: { email: userData.email },
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
    if (user.role !== UserRole.ADMIN) {
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
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: "30m",
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
      role: user.role,
    };
    this.loginHistoryServices.AddLoginHistory(loginData);
    return { accessToken, refreshToken };
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10); // hashes the plain password
  }

  private async comparePasswords(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword); // compares plain vs hashed
  }
}

/* const newPayload = { sub: 2, email: 'r1@gmail.com', role: 'admin' }; */
/* console.log('password:', await this.hashPassword(userData.password));
    console.log('token:', await this.jwtService.signAsync(newPayload)); */
