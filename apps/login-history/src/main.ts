import { NestFactory } from "@nestjs/core";
import { LoginHistoryModule } from "./login-history.module.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    LoginHistoryModule,
    {
      transport: Transport.GRPC,
      options: {
        package: "history",
        protoPath: join(process.cwd(), "proto/history.proto"),
        url: "0.0.0.0:50054",
      },
    }
  );
  await app.listen();
  console.log("Post gRPC microservice running on port 50054");
}
bootstrap();
