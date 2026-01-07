import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "path";
import { NotificationController } from "./notification.controller";
import { WebsocketGateway } from "./websocket.gateway";
import { LoggerModule } from "apps/common/logger/logger.module";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "NOTIFICATION_CLIENT",
        transport: Transport.GRPC,
        options: {
          package: "notification",
          protoPath: join(process.cwd(), "proto/notification.proto"),
          url: "0.0.0.0:50055",
        },
      },
    ]),
    LoggerModule,
  ],
  controllers: [NotificationController],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class NotificationModule {}
