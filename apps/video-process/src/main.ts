import { NestFactory } from "@nestjs/core";
import { VideoProcessModule } from "./video-process.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

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
  await app.listen();
}
bootstrap();
