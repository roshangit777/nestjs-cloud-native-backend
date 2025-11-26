import { Module } from "@nestjs/common";
import { LoginHistoryController } from "./login-history.controller";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "path";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "LOGIN_HISTORY_CLIENT",
        transport: Transport.GRPC,
        options: {
          package: "history",
          protoPath: join(process.cwd(), "proto/history.proto"),
          url:"0.0.0.0:50054",
        },
      },
    ]),
  ],
  controllers: [LoginHistoryController],
})
export class LoginHistoryModule {}
