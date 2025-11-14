import { Controller } from "@nestjs/common";
import { PostService } from "./post.service";
import { PostDto } from "./dto/post-dto";
import { FindPostsQueryDto } from "./dto/find-posts-query.dto";
import { Posts } from "./post.interfaces";
import { GrpcMethod, Payload } from "@nestjs/microservices";
import { PaginatedResponse } from "./entity/paginated-response.interface";

@Controller()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @GrpcMethod("PostService", "GetAllPost")
  getAllPost(
    @Payload() query: FindPostsQueryDto
  ): Promise<PaginatedResponse<Posts>> {
    return this.postService.findAll(query);
  }

  @GrpcMethod("PostService", "GetOnePost")
  getOnePost(@Payload() id: { id: number }) {
    return this.postService.findOnePost(id.id);
  }

  @GrpcMethod("PostService", "CreatePost")
  createOnePost(@Payload() data: any) {
    const postData: PostDto = data.postData;
    const user = data.user;
    return this.postService.createPost(postData, user);
  }

  @GrpcMethod("PostService", "UpdatePost")
  async updatePost(
    @Payload()
    data: {
      id: string;
      postData: { title: string; content: string };
    }
  ) {
    return await this.postService.updatePost(Number(data.id), data.postData);
  }

  @GrpcMethod("PostService", "DeletePost")
  async deletePost(@Payload() id: { id: number }) {
    return await this.postService.deletePost(id.id);
  }
}
