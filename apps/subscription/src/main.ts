import { NestFactory } from "@nestjs/core";
import { SubscriptionModule } from "./subscription.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";
import { AppLogger } from "apps/common/logger/logger.service";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    SubscriptionModule,
    {
      transport: Transport.GRPC,
      options: {
        package: "subscription",
        protoPath: join(process.cwd(), "proto/subscription.proto"),
        url: "0.0.0.0:50060",
      },
    }
  );

  const logger = app.get(AppLogger);
  app.useLogger(logger);

  await app.listen();
  console.log("Payment gRPC microservice running on port 50060");
}
bootstrap();
