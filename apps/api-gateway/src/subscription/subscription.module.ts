import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "path";
import { SubscriptionController } from "./subscription.controller";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "SUBSCRIPTION_CLIENT",
        transport: Transport.GRPC,
        options: {
          package: "subscription",
          protoPath: join(process.cwd(), "proto/subscription.proto"),
          url: "0.0.0.0:50060",
        },
      },
    ]),
  ],
  controllers: [SubscriptionController],
})
export class SubscriptionModule {}
