import { Injectable } from "@nestjs/common";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";
import { v4 as uuid } from "uuid";

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

  /* async uploadFile(localFilePath: string, fileName: string, fileType: string) {
    if (!process.env.AWS_S3_BUCKET_NAME) {
      throw new Error("S3 bucket name is missing");
    }
    const fileStream = createReadStream(localFilePath);

    const uploadParams: UploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `${Date.now()}-${fileName}`,
      ContentType: fileType,
      Body: fileStream,
    };

    await this.s3.send(new PutObjectCommand(uploadParams));

    return {
      url: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${uploadParams.Key}`,
      key: uploadParams.Key,
    };
  } */

  async getUploadUrl(size) {
    /* if (size > 100000) {
      throw new RpcException({
        code: status.INTERNAL,
        message: "Invalid file size",
      });
    } */
    const videoId = uuid();

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `original/${videoId}.mp4`,
      ContentType: "video/mp4",
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 900,
    });

    return { videoId, uploadUrl };
  }

  async deleteFile(key: string) {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    };

    await this.s3.send(new DeleteObjectCommand(params));

    return { message: "File deleted", key };
  }
}
