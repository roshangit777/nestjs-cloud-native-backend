import { NestFactory } from "@nestjs/core";
import { AuthModule } from "./auth.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";
import { GrpcCorrelationInterceptor } from "apps/common/interceptors/grpc-correlation.interceptor";

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

  app.useGlobalInterceptors(new GrpcCorrelationInterceptor());

  await app.listen();
  console.log("Post gRPC microservice running on port 50052");
}
bootstrap();
