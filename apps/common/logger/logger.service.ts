import { ConsoleLogger, Injectable } from "@nestjs/common";
import { asyncContext } from "../context/async-context";

@Injectable()
export class AppLogger extends ConsoleLogger {
  private attachCorrelation(data: Record<string, any>) {
    const correlationId = asyncContext.getStore()?.correlationId;

    console.log("correlationId from logger:", correlationId);

    if (correlationId) {
      return { correlationId, ...data };
    }
    return data;
  }

  logEvent(data: Record<string, any>) {
    const finalData = this.attachCorrelation(data);
    this.log(JSON.stringify(finalData));
  }

  errorEvent(data: Record<string, any>) {
    const finalData = this.attachCorrelation(data);
    this.error(JSON.stringify(finalData));
  }
}
