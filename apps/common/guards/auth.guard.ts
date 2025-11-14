import { status } from "@grpc/grpc-js";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RpcException } from "@nestjs/microservices";
import { Request } from "express";

interface Payload {
  name: string;
  sub: number;
  email: string;
  role: string;
}
interface AuthRequest extends Request {
  user?: Payload;
  /* interface Request {
  headers: IncomingHttpHeaders;
  body: any;
  params: any;
  query: any; */
  // ...but there's NO 'user' property here!
  //}
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: "Token missing",
      });
    }

    try {
      const secret = "jwtsecret";
      if (!secret)
        throw new RpcException({
          code: status.INTERNAL,
          message: "JWT_SECRET not defined",
        });

      const payload: Payload = await this.jwtService.verifyAsync(token, {
        secret,
      });

      if (!payload) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: "Invalid Token",
        });
      }
      // assign payload safely
      request.user = payload;
    } catch (error) {
      if (error) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: "Invalid Token or Expired Token",
        });
      }
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    // NestJS automatically parses cookies if you use cookie-parser
    // so `request.cookies` will be available
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) return undefined;
      const [type, token] = authHeader.split(" ");
      return type === "Bearer" ? token : undefined;
    } catch (error) {
      throw new RpcException({ code: status.INTERNAL, message: error.message });
    }
  }
}
