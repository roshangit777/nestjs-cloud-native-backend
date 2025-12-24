import { Module } from "@nestjs/common";
import { VideoProcessController } from "./video-process.controller";
import { VideoProcessService } from "./video-process.service";
import { AppModule } from "./app.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Video } from "./entity/videoUpload.entity";
import { S3Module } from "./AWS/aws-s3.module";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Module({
  imports: [
    AppModule,
    S3Module,
    TypeOrmModule.forFeature([Video]),
    ClientsModule.register([
      {
        name: "NOTIFICATION_RECORD_RMQ",
        transport: Transport.RMQ,
        options: {
          urls: ["amqp://guest:guest@localhost:5672"],
          queue: "notification_record_queue",
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [VideoProcessController],
  providers: [VideoProcessService],
})
export class VideoProcessModule {}
