import { Injectable } from "@nestjs/common";
import { ThrottlerException, ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class SubscriptionThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId = req.user?.id || req.ip;
    console.log("userid from sub throttler:", userId);

    return `subscription-${userId}`;
  }

  // allow only 3 subscription attempts
  protected getLimit(): number {
    return 3;
  }

  // within 10 minutes
  protected getTtl(): number {
    return 60;
  }

  protected throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(
      "Too many subscription attempts. Please try again later."
    );
  }
}
