import { Controller, Get } from "@nestjs/common";
import { VideoProcessService } from "./video-process.service";
import { MessagePattern, Payload } from "@nestjs/microservices";

@Controller()
export class VideoProcessController {
  constructor(private readonly videoProcessService: VideoProcessService) {}

  @MessagePattern("create_streaming_link")
  async videoProcessingHandle(@Payload() data) {
    await this.videoProcessService.videoProcessing(data);
  }

  @MessagePattern("delete_video")
  async deleteVideoHandle(
    @Payload() data: { id: string; userId: string | number }
  ) {
    await this.videoProcessService.deleteVideo(data.id, data.userId);
  }
}
