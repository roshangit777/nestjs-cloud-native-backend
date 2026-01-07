import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { AuthGuard } from "apps/common/guards/auth.guard";
import { CurrentUser } from "apps/common/decorators/current-user.decorator";
import { type CurrentUserInfo } from "./interfaces/subscription";
import { RolesGuard } from "apps/common/guards/roles.guard";
import { Roles } from "apps/common/decorators/roles.decorator";
import { SubscriptionThrottlerGuard } from "apps/common/guards/subscription-throttler.guard";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

@Controller("subscription")
export class SubscriptionController implements OnModuleInit {
  private subscriptionServices: any;
  constructor(
    @Inject("SUBSCRIPTION_CLIENT") private subscriptionClient: ClientGrpc
  ) {}

  onModuleInit() {
    this.subscriptionServices = this.subscriptionClient.getService(
      "Subscriptionservice"
    );
  }

  @UseGuards(AuthGuard, SubscriptionThrottlerGuard)
  @Post("buy")
  handleOrderCreation(@CurrentUser() user: CurrentUserInfo) {
    return this.subscriptionServices.SubscriptionOrder({
      amount: 299,
      currency: "INR",
      customer: {
        userId: user.sub,
        name: user.name,
        email: user.email,
        contact: "8088163015",
      },
    });
  }

  @UseGuards(AuthGuard)
  @Post("payment-confirmation")
  handlePaymentCheck(@Query("id") data: string) {
    return this.subscriptionServices.SubscriptionCheck({ id: data });
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @Get("get-subscribers")
  handleGetAllSubscriber() {
    return this.subscriptionServices.GetAllSubscriber({});
  }
}
