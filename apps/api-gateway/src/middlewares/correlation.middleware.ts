import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { asyncContext } from "apps/common/context/async-context";

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId =
      (req.headers["x-correlation-id"] as string) ?? randomUUID();

    asyncContext.run({ correlationId }, () => {
      res.setHeader("x-correlation-id", correlationId);
      next();
    });
  }
}
