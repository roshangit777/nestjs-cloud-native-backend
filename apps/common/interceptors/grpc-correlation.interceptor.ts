// apps/common/interceptors/grpc-correlation.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { asyncContext } from "apps/common/context/async-context";
import { Metadata } from "@grpc/grpc-js";

@Injectable()
export class GrpcCorrelationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metadata = context.getArgByIndex(1) as Metadata;

    const raw = metadata?.get("x-correlation-id")?.[0];

    const correlationId = typeof raw === "string" ? raw : raw?.toString();

    console.log("correlationId from interceptor:", correlationId);

    return asyncContext.run({ correlationId }, () => next.handle());
  }
}
