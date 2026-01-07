import { NestFactory } from "@nestjs/core";
import { ApiGatewayModule } from "./api-gateway.module";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { GrpcToHttpInterceptor } from "../../common/filters/global.exception";
import { Transport } from "@nestjs/microservices";
import { AppLogger } from "apps/common/logger/logger.service";

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  //cors configuration
  app.enableCors({
    origin: ["https://localhost:5432/"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    allowedHeaders: "Content-Type, Authorization",
  });
  app.use(cookieParser());
  //Helmet helps protect the app from common web vulnerabilities by setting various HTTP security headers automatically.
  app.use(helmet());
  app.useGlobalInterceptors(new GrpcToHttpInterceptor());

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: ["amqp://guest:guest@localhost:5672"],
      queue: "notification_queue",
      queueOptions: { durable: true },
    },
  });

  const logger = app.get(AppLogger);
  app.useLogger(logger);
  await app.startAllMicroservices();
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
