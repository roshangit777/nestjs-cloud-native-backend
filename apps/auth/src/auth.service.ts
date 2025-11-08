import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Repository } from "typeorm";
import { Users, UserRole } from "./entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { RegisterUserDto } from "./dto/register.dto";
import * as bcrypt from "bcrypt";
import { LoginUserDto } from "./dto/login.dto";
import { JwtService } from "@nestjs/jwt";
/* import { LoginHistory } from 'src/events/entity/login-history.entity'; */

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users) private userRepository: Repository<Users>,
    private jwtService: JwtService
    /* private readonly userEventService: UserEventsService, */
  ) {}

  async userRegister(userData: RegisterUserDto) {
    const existUser = await this.userRepository.findOne({
      where: { email: userData.email },
    });
    if (existUser) {
      throw new ConflictException("Email alredy exist use a different email");
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
      throw new ConflictException("Email alredy exist use a different email");
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
      throw new UnauthorizedException("Email or password is invalid");
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    /*  await this.userEventService.recordLogin(user.id); */
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: "30m",
    });
    const refresh_token = await this.jwtService.signAsync(
      { id: payload.sub },
      {
        expiresIn: "1d",
      }
    );
    return { access_token, refresh_token };
  }

  async refreshAndSetToken(token: string) {
    const secret = "jwtsecret";
    const result = await this.jwtService.verify(token, { secret });
    const user = await this.userRepository.findOne({
      where: { id: result.id },
    });

    if (!user) {
      throw new NotFoundException("User not found for Token Refresh");
    }
    const payload = { sub: user.id, email: user.email, role: user?.role };
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: "30m",
    });
    return access_token;
  }

  async loginAdmin(userData: LoginUserDto) {
    const user = await this.userRepository.findOne({
      where: { email: userData.email },
    });

    if (
      !user ||
      !(await this.comparePasswords(userData.password, user.password))
    ) {
      throw new UnauthorizedException("Email or password is invalid");
    }
    if (user.role !== UserRole.ADMIN) {
      {
        throw new UnauthorizedException("Insufficient permission");
      }
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    /* const newPayload = { sub: 2, email: 'r1@gmail.com', role: 'admin' }; */
    /* console.log('password:', await this.hashPassword(userData.password));
    console.log('token:', await this.jwtService.signAsync(newPayload)); */
    /* await this.userEventService.recordLogin(user.id); */
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: "30m",
    });
    const refresh_token = await this.jwtService.signAsync(
      { id: user.id },
      { expiresIn: "7d" }
    );
    return { access_token, refresh_token };
  }

  /*  async getUserLoginHistory(userId: number | undefined): Promise<any[]> {
    if (!userId) {
      return await this.loginUserHistoryRepository.find({
        relations: ["user"],
      });
    } else {
      const history = await this.loginUserHistoryRepository.find({
        where: { user: { id: userId } },
        select: ["loginTime"],
      });
      if (!history) {
        throw new NotFoundException(`Login record of the ${userId} not found`);
      }
      return history.map((item) => item.loginTime);
    }
  } */

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
