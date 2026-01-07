import { Module } from "@nestjs/common";
import { AppLogger } from "./logger.service";
import { CorrelationInterceptor } from "../correlation/correlation.interceptor";

@Module({
  imports: [],
  providers: [AppLogger, CorrelationInterceptor],
  exports: [AppLogger],
})
export class LoggerModule {}
