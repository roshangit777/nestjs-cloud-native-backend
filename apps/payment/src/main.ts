import { NestFactory } from "@nestjs/core";
import { PaymentModule } from "./payment.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";
import { AppLogger } from "apps/common/logger/logger.service";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentModule,
    {
      transport: Transport.GRPC,
      options: {
        package: "payment",
        protoPath: join(process.cwd(), "proto/payment.proto"),
        url: "0.0.0.0:50057",
      },
    }
  );

  await app.listen();
  console.log("Payment gRPC microservice running on port 50057");
}
bootstrap();
