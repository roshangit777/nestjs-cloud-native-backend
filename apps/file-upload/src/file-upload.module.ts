import { Module } from "@nestjs/common";
import { FileUploadController } from "./file-upload.controller";
import { FileUploadService } from "./file-upload.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CloudinaryModule } from "./cloudinary/cloudinary.module";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { AppModule } from "./app.module";
import { File } from "./entity/cloudinary.entity";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { S3Module } from "./AWS/aws-s3.module";
import { LoggerModule } from "apps/common/logger/logger.module";

@Module({
  imports: [
    AppModule,
    TypeOrmModule.forFeature([File]),
    CloudinaryModule,
    S3Module,
    MulterModule.register({ storage: memoryStorage() }),
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
    LoggerModule,
  ],
  controllers: [FileUploadController],
  providers: [FileUploadService],
})
export class FileUploadModule {}
