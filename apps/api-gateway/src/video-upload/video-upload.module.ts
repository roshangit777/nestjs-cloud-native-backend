import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "path";
import { VideoUploadController } from "./video-upload.controller";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "VIDEO_UPLOAD_CLIENT",
        transport: Transport.GRPC,
        options: {
          maxReceiveMessageLength: 50 * 1024 * 1024, // 50MB
          maxSendMessageLength: 50 * 1024 * 1024,
          package: "videoUpload",
          protoPath: join(process.cwd(), "proto/videoUpload.proto"),
          url: "0.0.0.0:50059",
        },
      },
    ]),
  ],
  controllers: [VideoUploadController],
})
export class VideoUploadModule {}
