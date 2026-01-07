import { NestFactory } from "@nestjs/core";
import { PostModule } from "./post.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";
import { AppLogger } from "apps/common/logger/logger.service";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PostModule,
    {
      transport: Transport.GRPC,
      options: {
        package: "post",
        protoPath: join(process.cwd(), "proto/post.proto"),
        url: "0.0.0.0:50051",
      },
    }
  );

  await app.listen();
  console.log("Post gRPC microservice running on port 50051");
}
bootstrap();
