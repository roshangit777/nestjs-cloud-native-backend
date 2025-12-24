import { Injectable } from "@nestjs/common";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { createReadStream } from "fs";
import { Readable } from "stream";

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

  async uploadFile(localFilePath: string, fileName: string, fileType: string) {
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
