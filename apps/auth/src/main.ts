import { NestFactory } from "@nestjs/core";
import { AuthModule } from "./auth.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.GRPC,
      options: {
        package: "auth",
        protoPath: join(process.cwd(), "proto/auth.proto"),
        url: "0.0.0.0:50052",
      },
    }
  );
  await app.listen();
  console.log("Post gRPC microservice running on port 50052");
}
bootstrap();
