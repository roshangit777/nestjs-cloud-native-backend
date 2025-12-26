import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Users } from "./entities/user.entity";
import { JwtModule } from "@nestjs/jwt";
/* import { EventsModule } from "src/events/events.module"; */
import { AppModule } from "./app.module";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { Roles } from "./entities/roles.entity";
import { UserRoleMap } from "./entities/user-role-map.entity";

@Module({
  imports: [
    AppModule,
    TypeOrmModule.forFeature([Users, Roles, UserRoleMap]),
    ClientsModule.register([
      {
        name: "LOGIN_HISTORY_RMQ",
        transport: Transport.RMQ,
        options: {
          urls: ["amqp://guest:guest@localhost:5672"],
          queue: "login_history_queue",
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: "NOTIFICATION_RECORD_RMQ",
        transport: Transport.RMQ,
        options: {
          urls: ["amqp://guest:guest@localhost:5672"],
          queue: "notification_record_queue",
          queueOptions: {
            durable: true,
          },
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
