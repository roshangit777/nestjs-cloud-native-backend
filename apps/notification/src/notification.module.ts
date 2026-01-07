import { Module } from "@nestjs/common";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notification } from "./entity/notification.entity";
import { AppModule } from "./app.module";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { LoggerModule } from "apps/common/logger/logger.module";

@Module({
  imports: [
    AppModule,
    TypeOrmModule.forFeature([Notification]),
    ClientsModule.register([
      {
        name: "NOTIFICATION_RMQ",
        transport: Transport.RMQ,
        options: {
          urls: ["amqp://guest:guest@localhost:5672"],
          queue: "notification_queue",
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
    LoggerModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
