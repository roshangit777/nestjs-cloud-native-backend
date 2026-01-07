// apps/common/grpc/with-correlation.ts
import { Metadata } from "@grpc/grpc-js";
import { asyncContext } from "../context/async-context";

export function withCorrelation(): Metadata {
  const metadata = new Metadata();
  const correlationId = asyncContext.getStore()?.correlationId;

  if (correlationId) {
    metadata.set("x-correlation-id", correlationId);
  }

  return metadata; // ✅ RETURN METADATA DIRECTLY
}
