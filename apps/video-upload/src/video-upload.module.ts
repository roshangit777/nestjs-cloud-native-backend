import { Module } from "@nestjs/common";
import { VideoUploadController } from "./video-upload.controller";
import { VideoUploadService } from "./video-upload.service";
import { AppModule } from "./app.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Video } from "./entity/videoUpload.entity";
import { S3Module } from "./AWS/aws-s3.module";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Module({
  imports: [
    AppModule,
    TypeOrmModule.forFeature([Video]),
    S3Module,
    ClientsModule.register([
      {
        name: "VIDEO_PROCESSING_RMQ",
        transport: Transport.RMQ,
        options: {
          urls: ["amqp://guest:guest@localhost:5672"],
          queue: "video_processing_queue",
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [VideoUploadController],
  providers: [VideoUploadService],
})
export class VideoUploadModule {}
