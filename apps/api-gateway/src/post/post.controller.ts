import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import type { ClientGrpc } from "@nestjs/microservices";
import { FindPostsQueryDto } from "./dto/find-posts-query.dto";
import { AuthGuard } from "apps/common/guards/auth.guard";
import { PostDto } from "./dto/post-dto";
import { CurrentUser } from "apps/common/decorators/current-user.decorator";
import { status } from "@grpc/grpc-js";

interface UserPayload {
  sub: number;
  email: string;
  role: string;
}

@Controller("post")
export class PostController implements OnModuleInit {
  private postServices: any;
  constructor(@Inject("POST_CLIENT") private postClient: ClientGrpc) {}

  onModuleInit() {
    this.postServices = this.postClient.getService("PostService");
  }

  @Get()
  getAllPost(@Query() query: FindPostsQueryDto) {
    return this.postServices.GetAllPost(query);
  }

  @Get(":id")
  getOnePost(@Param("id") id: number) {
    return this.postServices.GetOnePost({ id: Number(id) });
  }

  @UseGuards(AuthGuard)
  @Post("create")
  createOnePost(@Body() postData: PostDto, @CurrentUser() user: UserPayload) {
    if (!postData.title || !postData.content) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: "Title and Content should not be empty",
      });
    }
    return this.postServices.CreatePost({ postData, user });
  }

  @UseGuards(AuthGuard)
  @Put("update/:id")
  updatePost(@Param("id") id: string, @Body() postData: PostDto) {
    if (!id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: "Id should be valid",
      });
    }
    if (!postData.title || !postData.content) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: "Id should be valid",
      });
    }
    return this.postServices.UpdatePost({ id, postData });
  }

  @UseGuards(AuthGuard)
  @Delete("delete")
  deletePost(@Query("id") id: number) {
    if (!id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: "Id should be valid",
      });
    }
    return this.postServices.DeletePost({ id: Number(id) });
  }
}
