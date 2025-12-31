import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Injectable,
} from "@nestjs/common";
import { RedisService } from "apps/libs/infra/redis/redis.service";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    console.log("user:", req.user);
    const userId = req.user?.sub;
    if (!userId)
      throw new HttpException(
        {
          statusCode: 404,
          message: "Token not found",
        },
        404
      );

    const isAdmin = req.user?.role?.includes(UserRole.ADMIN);
    if (isAdmin) return true;

    const sub = await this.redis.get(`sub:${userId}`);

    if (!sub) {
      throw new ForbiddenException("Not a subscriber");
    }

    return true;
  }
}
