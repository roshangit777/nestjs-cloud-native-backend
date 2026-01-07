import { Module } from "@nestjs/common";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { ConfigModule } from "@nestjs/config";
import { AppModule } from "./app.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Orders, Payment } from "./entity/payment.entity";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Module({
  imports: [
    AppModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forFeature([Orders, Payment]),
    ClientsModule.register([
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
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
