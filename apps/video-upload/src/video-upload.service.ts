import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { S3Service } from "./AWS/aws-s3.service";
import { Video, VideoStatus } from "./entity/videoUpload.entity";
import { ClientProxy } from "@nestjs/microservices";
@Injectable()
export class VideoUploadService {
  constructor(
    @InjectRepository(Video)
    private readonly videoUploadRepository: Repository<Video>,
    private readonly s3BucketService: S3Service,
    @Inject("VIDEO_PROCESSING_RMQ") private videoProcessingClient: ClientProxy
  ) {}

  async getAwsUrl(data: { size: string; videoType: string }) {
    return this.s3BucketService.getUploadUrl(data.size);
  }

  async videoUploadConfirmation(data: {
    videoId: string;
    title: string;
    description: string;
    sizeBytes: number;
    user: { id: number; name: string; email: string; role: string };
  }) {
    const videoSave = this.videoUploadRepository.create({
      id: data.videoId,
      originalKey: `original/${data.videoId}.mp4`,
      status: VideoStatus.PROCESSING,
      uploader: data.user.id,
      userDetails: data.user,
      title: data.title,
      description: data.description,
      mimeType: "video/mp4",
      sizeBytes: data.sizeBytes,
    });

    await this.videoUploadRepository.save(videoSave);

    this.videoProcessingClient.emit("create_streaming_link", {
      id: data.videoId,
      fileName: data.title,
      userId: data.user.id,
    });

    return {
      videoId: data.videoId,
      status: "PROCESSING",
      streamUrl: null,
    };
  }

  async checkStatus(data: { id: string }) {
    const response = await this.videoUploadRepository.findOne({
      where: { id: data.id },
    });

    return {
      status: response?.status,
      streamKey: response?.streamKey,
      streamUrl: response?.streamUrl,
    };
  }

  async getAllVideos() {
    return await this.videoUploadRepository.find({ withDeleted: true });
  }

  async getAllStreamingVideos() {
    return await this.videoUploadRepository.find({
      where: { status: VideoStatus.READY },
    });
  }

  async softDelete(data: { id: string; userId: string | number }) {
    const video = await this.videoUploadRepository.findOne({
      where: { id: data.id },
    });

    if (!video) {
      return { message: "Video not found" };
    }

    if (video.status === VideoStatus.DELETING) {
      return { message: "Deletion already in progress" };
    }

    if (video.status === VideoStatus.DELETED) {
      return { message: "Video Deleted Successfully" };
    }

    await this.videoUploadRepository.update(
      { id: data.id },
      {
        status: VideoStatus.DELETING,
      }
    );

    this.videoProcessingClient.emit("delete_video", {
      id: data.id,
      userId: data.userId,
    });

    return { message: "Video deletion started" };
  }
}
