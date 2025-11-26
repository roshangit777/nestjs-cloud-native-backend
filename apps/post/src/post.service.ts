import { Inject, Injectable } from "@nestjs/common";
import { Post } from "./post.interfaces";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { FindPostsQueryDto } from "./dto/find-posts-query.dto";
import type { Cache } from "cache-manager";
import { ClientProxy, RpcException } from "@nestjs/microservices";
import { Posts } from "./entity/post.entity";
import { PaginatedResponse } from "./entity/paginated-response.interface";
import { status } from "@grpc/grpc-js";

interface AuthorData {
  sub: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable()
export class PostService {
  private postListCacheKeys: Set<string> = new Set();
  constructor(
    @InjectRepository(Posts) private usePostsRepository: Repository<Posts>,
    @Inject(CACHE_MANAGER) private cachManager: Cache,
    @Inject("NOTIFICATION_RECORD_RMQ") private notificationClient: ClientProxy
  ) {}

  private generatePostsListCacheKey(query: FindPostsQueryDto): string {
    const { page = 1, limit = 10, title } = query;
    return `posts_list_page${page}_limit${limit}_title${title || "all"}`;
  }
  // this is plain fetch
  /* async findAll() {
    const posts = await this.usePostsRepository.find({
      relations: ['author'],
      select: {
        author: {
          id: true,
          name: true,
          email: true,
        },
      },
    });
    if (!posts) {
      throw new NotFoundException();
    }
    return posts;
  } */

  // this is using catch and pagination
  async findAll(query: FindPostsQueryDto): Promise<PaginatedResponse<Posts>> {
    const cacheKey = this.generatePostsListCacheKey(query);

    this.postListCacheKeys.add(cacheKey);

    const getCachedData =
      await this.cachManager.get<PaginatedResponse<Posts>>(cacheKey);

    if (getCachedData) {
      console.log(
        `Cache Hit --------> Returning posts list from Cache ${cacheKey}`
      );
      return getCachedData;
    }
    console.log(`Cache Miss --------> Returning posts list from database`);
    const { page = 1, limit = 10, title } = query;
    const skip = (page - 1) * limit;
    /* const queryBuilder = this.usePostsRepository
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.author", "author")
      .orderBy("post.createdAt", "DESC")
      .skip(skip)
      .take(limit); */
    const queryBuilder = this.usePostsRepository
      .createQueryBuilder("post")
      .orderBy("post.createdAt", "DESC")
      .skip(skip)
      .take(limit);

    if (title) {
      queryBuilder.andWhere("post.title ILIKE :title", {
        title: `%${title}%`,
      });
    }
    const [items, totalItems] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(totalItems / limit);
    const responseResult = {
      items,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    };
    await this.cachManager.set(cacheKey, responseResult, 60000);
    return responseResult;
  }

  async findOnePost(id: number) {
    const post = await this.usePostsRepository.findOne({
      where: { id },
    });
    if (!post) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Post with ID ${id} not found`,
      });
    }
    return post;
  }

  async createPost(postData: Omit<Post, "id" | "createdAt">, name: AuthorData) {
    const post = this.usePostsRepository.create({
      title: postData.title,
      content: postData.content,
      createdAt: new Date().toLocaleDateString(),
      author: Number(name.sub),
    });
    // clearing catch here
    for (const key of this.postListCacheKeys) {
      await this.cachManager.del(key);
    }

    //clearing the set(cachekeystorage)
    this.postListCacheKeys.clear();
    const result = await this.usePostsRepository.save(post);

    this.notificationClient.emit("record_notification", {
      userId: Number(name.sub),
      type: "success",
      title: "Successfull Post",
      message: `The post with title "${post.title}" has been posted.`,
    });
    return result;
  }

  async updatePost(id: number, postData: Omit<Post, "id" | "createdAt">) {
    if (postData.title && !postData.content) {
      const post = await this.usePostsRepository.findOne({ where: { id: id } });
      if (!post) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: "Post doesn't exist",
        });
      }
      await this.usePostsRepository.update({ id }, { title: postData.title });
      return { message: "Post has been updated" };
    } else if (!postData.title && postData.content) {
      const post = await this.usePostsRepository.findOne({ where: { id: id } });
      if (!post) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: "Post doesn't exist",
        });
      }
      await this.usePostsRepository.update(
        { id },
        { content: postData.content }
      );
      return { message: "Post has been updated" };
    } else if (postData.title && postData.content) {
      const post = await this.usePostsRepository.findOne({ where: { id: id } });
      if (!post) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: "Post doesn't exist",
        });
      }
      await this.usePostsRepository.update(
        { id },
        { title: postData.title, content: postData.content }
      );
      return { message: "Post has been updated" };
    }
  }

  async deletePost(id: number) {
    const post = await this.usePostsRepository.findOne({ where: { id: id } });
    if (!post) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: "Post doesn't exist",
      });
    }
    await this.usePostsRepository.delete({ id });
    return { message: "Post deleted successfully", post };
  }
}
