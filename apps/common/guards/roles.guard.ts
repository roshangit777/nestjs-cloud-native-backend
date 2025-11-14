import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

interface JwtPayload {
  name: string;
  sub: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/*Workflow
client => jwtauthguard => validate the token and attach the current user in the request => rolesguard check if current user role matchs the required role => if match found proceed to controller => if not forbidden exception
*/
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    // retrive the roles metadata set by the roles decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [
        context.getHandler(), // method level metadata
        context.getClass(), // class level metadata
      ]
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user) {
      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: "User not authenticated",
      });
    }
    const hasRequiredRole = requiredRoles.some((role) => role === user.role);
    console.log(requiredRoles);
    if (!hasRequiredRole) {
      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: "Insufficient permission",
      });
    }
    return true;
  }
}
