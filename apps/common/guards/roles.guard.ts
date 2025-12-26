import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

interface JwtPayload {
  name: string;
  sub: number;
  email: string;
  role: string[];
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
      throw new HttpException(
        {
          statusCode: 403,
          message: "User not authenticated",
        },
        403
      );
    }

    const hasRequiredRole = requiredRoles.some((role) =>
      user.role.includes(role)
    );

    if (!hasRequiredRole) {
      throw new HttpException(
        {
          statusCode: 403,
          message: "Insufficient permission",
        },
        403
      );
    }
    return true;
  }
}
