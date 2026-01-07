import { Module } from "@nestjs/common";
import { LoginHistoryModuleController } from "./login-history.module.controller";
import { LoginHistoryModuleService } from "./login-history.module.service";
import { AppModule } from "./app.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoginHistory } from "./entity/login-history.entity";
import { LoggerModule } from "apps/common/logger/logger.module";

@Module({
  imports: [AppModule, TypeOrmModule.forFeature([LoginHistory]), LoggerModule],
  controllers: [LoginHistoryModuleController],
  providers: [LoginHistoryModuleService],
})
export class LoginHistoryModule {}
