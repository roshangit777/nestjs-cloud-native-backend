import { NestFactory } from "@nestjs/core";
import { FileUploadModule } from "./file-upload.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    FileUploadModule,
    {
      transport: Transport.GRPC,
      options: {
        package: "fileUpload",
        protoPath: join(process.cwd(), "proto/fileUpload.proto"),
        url: "0.0.0.0:50053",
      },
    }
  );
  await app.listen();
  console.log("Post gRPC microservice running on port 50053");
}
bootstrap();
