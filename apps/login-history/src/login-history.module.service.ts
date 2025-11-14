import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LoginHistory } from "./entity/login-history.entity";
import { Repository } from "typeorm";
import { RpcException } from "@nestjs/microservices";
import { UserDetails } from "./interfaces/userDetails.interface";
import { status } from "@grpc/grpc-js";

@Injectable()
export class LoginHistoryModuleService {
  constructor(
    @InjectRepository(LoginHistory)
    private loginHistoryRepository: Repository<LoginHistory>
  ) {}

  async recordLogin(data: UserDetails): Promise<void> {
    const login = this.loginHistoryRepository.create({
      user: data.id,
      userDetails: data,
    });
    await this.loginHistoryRepository.save(login);
  }

  async getAllUserLoginHistory(): Promise<any[]> {
    return await this.loginHistoryRepository.find({});
  }

  async getOneUserLoginHistory(id: number): Promise<any[]> {
    const history = await this.loginHistoryRepository.find({
      where: { user: id },
      select: ["loginTime"],
    });
    if (!history || history.length === 0) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Login record of the ${id} not found`,
      });
    }
    return history.map((item) => item.loginTime);
  }
}
