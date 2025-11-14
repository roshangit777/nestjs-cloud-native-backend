import { status } from "@grpc/grpc-js";
import { Inject, Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
/* import * as streamifier from 'streamifier'; */
import fs from "fs";

@Injectable()
export class CloudinaryService {
  constructor(@Inject("CLOUDINARY") private readonly clodinary: any) {}

  uploadFile(filePath: string): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = this.clodinary.uploader.upload_stream(
        {
          folder: "for-nestjs",
          resource_type: "auto",
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error)
            reject(
              new RpcException({
                code: status.INTERNAL,
                message: `Error in Cloudinary Service: ${error.message}`,
              })
            );
          resolve(result);
        }
      );
      //convert the file buffer to a readable string and then it will pipe to the uplaod stream
      fs.createReadStream(filePath).pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string): Promise<any> {
    return await this.clodinary.uploader.destroy(publicId);
  }
}
