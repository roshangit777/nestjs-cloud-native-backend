import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "path";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "AUTH_CLIENT",
        transport: Transport.GRPC,
        options: {
          package: "auth",
          protoPath: join(process.cwd(), "proto/auth.proto"),
          url: "0.0.0.0:50052",
        },
      },
    ]),
  ],
  controllers: [AuthController],
})
export class AuthModule {}
