import { NestFactory } from "@nestjs/core";
import { PurchaseModule } from "./purchase.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PurchaseModule,
    {
      transport: Transport.GRPC,
      options: {
        package: "purchase",
        protoPath: join(process.cwd(), "proto/purchase.proto"),
        url: "0.0.0.0:50058",
      },
    }
  );

  await app.listen();
  console.log("Purchase gRPC microservice running on port 50058");
}
bootstrap();
