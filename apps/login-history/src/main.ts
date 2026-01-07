import { NestFactory } from "@nestjs/core";
import { LoginHistoryModule } from "./login-history.module.module";
import { Transport } from "@nestjs/microservices";
import { join } from "path";
import { AppLogger } from "apps/common/logger/logger.service";
import { GrpcCorrelationInterceptor } from "apps/common/interceptors/grpc-correlation.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(LoginHistoryModule);

  //For GRPC
  app.connectMicroservice({
    transport: Transport.GRPC,
    options: {
      package: "history",
      protoPath: join(process.cwd(), "proto/history.proto"),
      url: "0.0.0.0:50054",
    },
  });

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: ["amqp://guest:guest@localhost:5672"],
      queue: "login_history_queue",
      queueOptions: {
        durable: true,
      },
    },
  });

  app.useGlobalInterceptors(new GrpcCorrelationInterceptor());
  /* app.useGlobalInterceptors(new CorrelationInterceptor()); */
  const logger = app.get(AppLogger);
  app.useLogger(logger);
  await app.startAllMicroservices();
  console.log("Post gRPC microservice running on port 50054");
}
bootstrap();
