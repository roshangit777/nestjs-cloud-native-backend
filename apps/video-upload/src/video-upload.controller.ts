import { Controller, Get } from "@nestjs/common";
import { VideoUploadService } from "./video-upload.service";
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

@Controller()
export class VideoUploadController {
  constructor(private readonly videoUploadService: VideoUploadService) {}

  @GrpcMethod("VideoUploadService", "AwsUrl")
  async getAwsUrlHandle(@Payload() data) {
    return await this.videoUploadService.getAwsUrl(data);
  }

  @GrpcMethod("VideoUploadService", "UploadConfirmation")
  async videoUploadConfirmationHandle(@Payload() data) {
    return await this.videoUploadService.videoUploadConfirmation(data);
  }

  @GrpcMethod("VideoUploadService", "VideoStatus")
  async videoStatusHandle(@Payload() data) {
    return await this.videoUploadService.checkStatus(data);
  }

  @GrpcMethod("VideoUploadService", "GetAllVideos")
  async getAllVideosHandle() {
    const result = await this.videoUploadService.getAllVideos();
    return { result };
  }

  @GrpcMethod("VideoUploadService", "GetAllStramingVideos")
  async getAllStreamingVideosHandle() {
    const result = await this.videoUploadService.getAllStreamingVideos();
    return { result };
  }

  @GrpcMethod("VideoUploadService", "DeleteVideo")
  async softDeleteHandle(
    @Payload() data: { id: string; userId: string | number }
  ) {
    return await this.videoUploadService.softDelete(data);
  }
}
