import { Injectable } from "@nestjs/common";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { createReadStream, createWriteStream } from "fs";
import path from "path";
import fs from "fs";

export interface UploadParams {
  Bucket: string;
  Key: string;
  Body: Buffer | Uint8Array | Blob | string | Readable;
  ContentType: string;
  ACL?: "private" | "public-read" | "authenticated-read" | "public-read-write";
}

@Injectable()
export class S3Service {
  private s3 = new S3Client({
    region: process.env.AWS_S3_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });

  async uploadFile(data: {
    videoId: string;
    localFilePath: string;
    fileName: string;
  }) {
    if (!process.env.AWS_S3_BUCKET_NAME) {
      throw new Error("S3 bucket name is missing");
    }

    const stat = fs.statSync(data.localFilePath);
    if (!stat.isFile()) {
      throw new Error(`Not a file: ${data.localFilePath}`);
    }

    const ext = path.extname(data.fileName);

    let contentType = "application/octet-stream";
    if (ext === ".m3u8") contentType = "application/vnd.apple.mpegurl";
    if (ext === ".ts") contentType = "video/mp2t";

    const fileStream = createReadStream(data.localFilePath);

    const uploadParams: UploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `hls/${data.videoId}/${data.fileName}`,
      ContentType: contentType,
      Body: fileStream,
    };

    await this.s3.send(new PutObjectCommand(uploadParams));

    return {
      url: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${uploadParams.Key}`,
      key: uploadParams.Key,
    };
  }

  async getAWSFile(videoId: string) {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `original/${videoId}.mp4`,
    });

    const response = await this.s3.send(command);

    const tempDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const inputPath = path.join(tempDir, `${videoId}.mp4`);

    await pipeline(
      response.Body as NodeJS.ReadableStream,
      createWriteStream(inputPath)
    );

    return inputPath;
  }

  async deleteOriginalFile(videoId: string) {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `original/${videoId}.mp4`,
    };
    await this.s3.send(new DeleteObjectCommand(params));
  }

  async deleteHlsFolder(videoId: string) {
    const prefix = `hls/${videoId}/`;

    const list = await this.s3.send(
      new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Prefix: prefix,
      })
    );

    if (!list.Contents || list.Contents.length === 0) return;

    await this.s3.send(
      new DeleteObjectsCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Delete: {
          Objects: list.Contents.map((obj) => ({ Key: obj.Key! })),
        },
      })
    );
  }
}
