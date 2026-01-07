import { Inject, Injectable } from "@nestjs/common";
import { S3Service } from "./AWS/aws-s3.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Video, VideoStatus } from "./entity/videoUpload.entity";
import { Repository } from "typeorm";
import fs from "fs";
import { ClientProxy, RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";
import { exec } from "child_process";
import path from "path";
import { AppLogger } from "apps/common/logger/logger.service";

@Injectable()
export class VideoProcessService {
  constructor(
    @InjectRepository(Video)
    private readonly videoUploadRepository: Repository<Video>,
    private readonly s3BucketService: S3Service,
    @Inject("NOTIFICATION_RECORD_RMQ") private notificationClient: ClientProxy,
    private readonly logger: AppLogger
  ) {}
  async videoProcessing(data: {
    id: string;
    fileName: string;
    userId: number | string;
  }) {
    this.logger.logEvent({
      event: "VIDEO_PROCESSING",
      status: "START",
      userId: data.userId,
    });

    let filePath = "";
    let outputDir = "";
    try {
      //aws get file
      filePath = await this.s3BucketService.getAWSFile(data.id);
      if (!fs.existsSync(filePath)) {
        throw new RpcException({
          code: status.INTERNAL,
          message: "Video download failed",
        });
      }

      //output dir
      const tempRoot = path.join(process.cwd(), "tmp");
      outputDir = path.join(tempRoot, "hls", data.id);
      fs.mkdirSync(outputDir, { recursive: true });

      //ffmpeg process
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -i "${filePath}" -profile:v baseline -level 3.0 -start_number 0 -hls_time 6 -hls_list_size 0 -f hls "${path.join(outputDir, "master.m3u8")}"`,
          (error) => {
            if (error) reject(error);
            else resolve(true);
          }
        );
      });

      //uploading files to the aws
      const files = fs.readdirSync(outputDir);
      for (const file of files) {
        const fullPath = path.join(outputDir, file);
        await this.s3BucketService.uploadFile({
          videoId: data.id,
          localFilePath: fullPath,
          fileName: file, //
        });
      }

      //key and url set
      const masterKey = `hls/${data.id}/master.m3u8`;
      const masterUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${masterKey}`;

      //database update
      await this.videoUploadRepository.update(
        {
          id: data.id,
        },
        {
          streamKey: masterKey,
          streamUrl: masterUrl,
          status: VideoStatus.READY,
        }
      );

      this.notificationClient.emit("record_notification", {
        userId: Number(data.userId),
        type: "success",
        title: "Successfully Video Uploaded",
        message: `The Video with title "${data.fileName}" has been uploaded.`,
      });
      this.logger.logEvent({
        event: "VIDEO_PROCESSING",
        status: "SUCCESS",
        userId: data.userId,
      });
    } catch (err) {
      await this.videoUploadRepository.update(
        {
          id: data.id,
        },
        {
          status: VideoStatus.FAILED,
          uploadErrorReason: err.message,
        }
      );
      this.logger.errorEvent({
        event: "VIDEO_PROCESSING",
        status: "FAILED",
        userId: data.userId,
        error: err.message,
        stack: err.stack,
      });
    } finally {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (fs.existsSync(outputDir))
        fs.rmSync(outputDir, { recursive: true, force: true });
    }
  }

  async deleteVideo(videoId: string, userId: string | number) {
    const videoTitle = await this.videoUploadRepository.findOne({
      select: ["title"],
      where: { id: videoId },
    });
    try {
      await this.s3BucketService.deleteOriginalFile(videoId);
      await this.s3BucketService.deleteHlsFolder(videoId);

      await this.videoUploadRepository.manager.transaction(async (manager) => {
        await manager.update(
          Video,
          { id: videoId },
          {
            status: VideoStatus.DELETED,
          }
        );

        await manager.softDelete(Video, { id: videoId });

        this.notificationClient.emit("record_notification", {
          userId: Number(userId),
          type: "success",
          title: "Successfully Video Deleted",
          message: `The Video with title "${videoTitle?.title}" has been deleted.`,
        });
      });
    } catch (error) {
      console.error("Error in Video Delete:", error.message);

      await this.videoUploadRepository.update(
        { id: videoId },
        {
          status: VideoStatus.DELETE_FAILED,
          deleteErrorReason: error.message,
        }
      );

      this.notificationClient.emit("record_notification", {
        userId: Number(userId),
        type: "fail",
        title: "Failed to deleted the Video",
        message: `The Video with title "${videoTitle?.title}" has not been deleted.`,
      });
    }
  }
}
