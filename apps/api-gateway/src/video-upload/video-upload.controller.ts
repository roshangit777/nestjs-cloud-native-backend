import { status } from "@grpc/grpc-js";
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  OnModuleInit,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { RpcException, type ClientGrpc } from "@nestjs/microservices";
import { CurrentUser } from "apps/common/decorators/current-user.decorator";
import { Roles } from "apps/common/decorators/roles.decorator";
import { AuthGuard } from "apps/common/guards/auth.guard";
import { RolesGuard } from "apps/common/guards/roles.guard";

interface AuthorData {
  name: string;
  sub: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

@Controller("videos")
export class VideoUploadController implements OnModuleInit {
  private videoUplaodServices: any;
  constructor(
    @Inject("VIDEO_UPLOAD_CLIENT") private fileUploadClient: ClientGrpc
  ) {}

  onModuleInit() {
    this.videoUplaodServices =
      this.fileUploadClient.getService("VideoUploadService");
  }

  @Post("video-upload")
  @UseGuards(AuthGuard)
  getAwsUrl(@Body() uploadfileDto: { size: string; contentType: string }) {
    return this.videoUplaodServices.AwsUrl(uploadfileDto);
  }

  @Post("upload-confirmation")
  @UseGuards(AuthGuard)
  uploadConfirmation(
    @Body()
    uploadfileDto: {
      videoId: string;
      size: string;
      title: string;
      description: string;
    },
    @CurrentUser() user: AuthorData
  ) {
    return this.videoUplaodServices.UploadConfirmation({
      videoId: uploadfileDto.videoId,
      title: uploadfileDto.title,
      description: uploadfileDto.description,
      sizeBytes: uploadfileDto.size,
      user: {
        id: user.sub,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }

  @Get("status/:id")
  @UseGuards(AuthGuard)
  videoStatus(@Param("id") id: string) {
    return this.videoUplaodServices.VideoStatus({ id });
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  getAllVideos() {
    return this.videoUplaodServices.GetAllVideos({});
  }

  @Delete("delete-files")
  @UseGuards(AuthGuard)
  deleteFile(
    @Query("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthorData
  ) {
    if (!id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: "Id needed to delete the File",
      });
    }
    return this.videoUplaodServices.DeleteVideo({ id: id, userId: user.sub });
  }
}
