import { NestFactory } from "@nestjs/core";
import { VideoUploadModule } from "./video-upload.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    VideoUploadModule,
    {
      transport: Transport.GRPC,
      options: {
        maxReceiveMessageLength: 50 * 1024 * 1024, // 50MB
        maxSendMessageLength: 50 * 1024 * 1024,
        package: "videoUpload",
        protoPath: join(process.cwd(), "proto/videoUpload.proto"),
        url: "0.0.0.0:50059",
      },
    }
  );
  await app.listen();
  console.log("Post gRPC microservice running on port 50059");
}
bootstrap();
