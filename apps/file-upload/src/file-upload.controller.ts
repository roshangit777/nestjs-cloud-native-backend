import { Controller } from "@nestjs/common";
import { FileUploadService } from "./file-upload.service";
import { GrpcMethod, Payload } from "@nestjs/microservices";

interface AuthorData {
  name: string;
  sub: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}
interface FileData {
  file: Express.Multer.File;
  description: string | undefined;
  user: AuthorData;
}

@Controller("file-upload")
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @GrpcMethod("fileUploadService", "UploadFile")
  async uploadFile(@Payload() data: FileData): Promise<any> {
    return this.fileUploadService.uploadFile({
      file: data.file,
      description: data.description,
      user: data.user,
    });
  }

  @GrpcMethod("fileUploadService", "GetAllFile")
  async getFile() {
    const result = await this.fileUploadService.findAll();
    return { files: result };
  }

  @GrpcMethod("fileUploadService", "DeleteFile")
  async deleteFile(@Payload() data: any): Promise<{ message: string }> {
    return await this.fileUploadService.remove({ id: data.id });
  }
}
