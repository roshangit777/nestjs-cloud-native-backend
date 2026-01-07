import { NestFactory } from "@nestjs/core";
import { FileUploadModule } from "./file-upload.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";
import { AppLogger } from "apps/common/logger/logger.service";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    FileUploadModule,
    {
      transport: Transport.GRPC,
      options: {
        maxReceiveMessageLength: 50 * 1024 * 1024, // 50MB
        maxSendMessageLength: 50 * 1024 * 1024,
        package: "fileUpload",
        protoPath: join(process.cwd(), "proto/fileUpload.proto"),
        url: "0.0.0.0:50053",
      },
    }
  );

  const logger = app.get(AppLogger);
  app.useLogger(logger);

  await app.listen();
  console.log("Post gRPC microservice running on port 50053");
}
bootstrap();
