import { NestFactory } from "@nestjs/core";
import { SubscriptionModule } from "./subscription.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";

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
  await app.listen();
  console.log("Payment gRPC microservice running on port 50060");
}
bootstrap();
