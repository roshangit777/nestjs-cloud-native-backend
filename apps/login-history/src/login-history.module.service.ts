import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LoginHistory } from "./entity/login-history.entity";
import { Repository } from "typeorm";
import { RpcException } from "@nestjs/microservices";
import { UserDetails } from "./interfaces/userDetails.interface";
import { status } from "@grpc/grpc-js";
import { AppLogger } from "apps/common/logger/logger.service";

@Injectable()
export class LoginHistoryModuleService {
  constructor(
    @InjectRepository(LoginHistory)
    private loginHistoryRepository: Repository<LoginHistory>,
    private readonly logger: AppLogger
  ) {}

  async recordLogin(data: UserDetails): Promise<void> {
    this.logger.logEvent({
      event: "LOGIN_HISTORY_SAVED",
      status: "START",
      userId: data.id,
    });
    try {
      const login = this.loginHistoryRepository.create({
        user: data.id,
        userDetails: data,
      });
      await this.loginHistoryRepository.save(login);
      this.logger.logEvent({
        event: "LOGIN_HISTORY_SAVED",
        status: "SUCCESS",
        userId: data.id,
      });
    } catch (error) {
      this.logger.errorEvent({
        event: "LOGIN_HISTORY_SAVED",
        status: "FAILED",
        userId: data.id,
        error: error.message,
        stack: error.stack,
      });
    }
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
