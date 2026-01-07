import { Module } from "@nestjs/common";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionService } from "./subscription.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  Subscription,
  SubscriptionPayment,
} from "./entity/subscription.entity";
import { AppModule } from "./app.module";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "path";
import { RedisModule } from "apps/libs/infra/redis/redis.module";
import { LoggerModule } from "apps/common/logger/logger.module";

@Module({
  imports: [
    AppModule,
    TypeOrmModule.forFeature([Subscription, SubscriptionPayment]),
    ClientsModule.register([
      {
        name: "PAYMENT_CLIENT",
        transport: Transport.GRPC,
        options: {
          package: "payment",
          protoPath: join(process.cwd(), "proto/payment.proto"),
          url: "0.0.0.0:50057",
        },
      },
    ]),
    RedisModule,
    LoggerModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
})
export class SubscriptionModule {}
