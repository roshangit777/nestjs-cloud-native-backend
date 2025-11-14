import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
} from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { status } from "@grpc/grpc-js";

@Injectable()
export class GrpcToHttpInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        const httpError = this.mapGrpcErrorToHttp(err);
        return throwError(() => httpError);
      })
    );
  }

  private mapGrpcErrorToHttp(err: any): HttpException {
    const grpcCode = err.code;

    const map = {
      [status.NOT_FOUND]: 404,
      [status.INVALID_ARGUMENT]: 400,
      [status.UNAUTHENTICATED]: 401,
      [status.PERMISSION_DENIED]: 403,
      [status.ALREADY_EXISTS]: 409,
      [status.FAILED_PRECONDITION]: 412,
      [status.UNIMPLEMENTED]: 501,
      [status.UNAVAILABLE]: 503,
      [status.INTERNAL]: 500,
    };

    const httpStatus = map[grpcCode] || 500;

    return new HttpException(
      {
        statusCode: httpStatus,
        message: err.details || "gRPC error",
      },
      httpStatus
    );
  }
}
