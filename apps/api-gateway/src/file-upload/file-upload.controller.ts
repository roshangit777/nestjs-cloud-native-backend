import { status } from "@grpc/grpc-js";
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  OnModuleInit,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { RpcException } from "@nestjs/microservices";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentUser } from "apps/common/decorators/current-user.decorator";
import { AuthGuard } from "apps/common/guards/auth.guard";

interface AuthorData {
  name: string;
  sub: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

@Controller("file-upload")
export class FileUploadController implements OnModuleInit {
  private fileUplaodServices: any;
  constructor(
    @Inject("FILE_UPLOAD_CLIENT") private fileUploadClient: ClientGrpc
  ) {}

  onModuleInit() {
    this.fileUplaodServices =
      this.fileUploadClient.getService("fileUploadService");
  }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadfileDto: { description: string | undefined },
    @CurrentUser() user: AuthorData
  ) {
    if (!file) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: "File needed",
      });
    }
    return this.fileUplaodServices.UploadFile({
      file,
      description: uploadfileDto.description,
      user,
    });
  }

  @Get("get-files")
  getFile() {
    return this.fileUplaodServices.GetAllFile({});
  }

  @UseGuards(AuthGuard)
  @Delete("delete-files")
  deleteFile(@Query("id", ParseUUIDPipe) id: string) {
    if (!id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: "Id needed to delete the File",
      });
    }
    return this.fileUplaodServices.DeleteFile({ id });
  }
}
