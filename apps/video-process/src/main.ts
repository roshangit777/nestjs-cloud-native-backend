import { NestFactory } from "@nestjs/core";
import { VideoProcessModule } from "./video-process.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppLogger } from "apps/common/logger/logger.service";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    VideoProcessModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: ["amqp://guest:guest@localhost:5672"],
        queue: "video_processing_queue",
        queueOptions: {
          durable: true,
        },
      },
    }
  );

  const logger = app.get(AppLogger);
  app.useLogger(logger);

  await app.listen();
}
bootstrap();
