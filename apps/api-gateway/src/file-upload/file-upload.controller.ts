import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ClientProxy, RpcException } from "@nestjs/microservices";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentUser } from "apps/common/decorators/current-user.decorator";
import { AuthGuard } from "apps/common/guards/auth.guard";

interface AuthorData {
  sub: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

@Controller("file-upload")
export class FileUploadController {
  constructor(
    @Inject("FILE_UPLOAD_CLIENT") private fileUploadClient: ClientProxy
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadfileDto: string | undefined,
    @CurrentUser() user: AuthorData
  ) {
    if (!file) {
      throw new RpcException({ status: 400, message: "File needed" });
    }

    return this.fileUploadClient.send("file.upload", {
      file,
      uploadfileDto,
      user,
    });
  }

  @Get("get-files")
  getFile() {
    return this.fileUploadClient.send("file.findAll", {});
  }

  @UseGuards(AuthGuard)
  @Delete("delete-files")
  deleteFile(@Query("id", ParseUUIDPipe) id: string) {
    if (!id) {
      throw new RpcException({
        status: 400,
        message: "Id needed to delete the File",
      });
    }
    return this.fileUploadClient.send("file.delete", id);
  }
}
