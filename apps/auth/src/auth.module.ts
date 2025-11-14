import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Users } from "./entities/user.entity";
import { JwtModule } from "@nestjs/jwt";
/* import { EventsModule } from "src/events/events.module"; */
import { AppModule } from "./app.module";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "path";

@Module({
  imports: [
    AppModule,
    TypeOrmModule.forFeature([Users]),
    ClientsModule.register([
      {
        name: "LOGIN_HISTORY_CLIENT",
        transport: Transport.GRPC,
        options: {
          package: "history",
          protoPath: join(process.cwd(), "proto/history.proto"),
          url: "0.0.0.0:50054",
        },
      },
    ]),
    JwtModule.register({
      global: true,
      secret: "jwtsecret",
    }),
    /* EventsModule, */
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
