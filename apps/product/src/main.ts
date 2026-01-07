import { NestFactory } from "@nestjs/core";
import { ProductModule } from "./product.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";
import { AppLogger } from "apps/common/logger/logger.service";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProductModule,
    {
      transport: Transport.GRPC,
      options: {
        package: "product",
        protoPath: join(process.cwd(), "proto/product.proto"),
        url: "0.0.0.0:50056",
      },
    }
  );

  await app.listen();
  console.log("Product gRPC microservice running on port 50056");
}
bootstrap();
