import { Module } from "@nestjs/common";
import { FileUploadController } from "./file-upload.controller";
import { FileUploadService } from "./file-upload.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CloudinaryModule } from "./cloudinary/cloudinary.module";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { AppModule } from "./app.module";
import { File } from "./entity/cloudinary.entity";

@Module({
  imports: [
    AppModule,
    TypeOrmModule.forFeature([File]),
    CloudinaryModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [FileUploadController],
  providers: [FileUploadService],
})
export class FileUploadModule {}
