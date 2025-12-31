import { Controller } from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";
import { GrpcMethod, Payload } from "@nestjs/microservices";
import {
  SubscriptionOrderResponse,
  type SubscriptionData,
} from "./interface/subscription.interface";

@Controller()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @GrpcMethod("Subscriptionservice", "SubscriptionOrder")
  async subOrder(@Payload() data: SubscriptionData) {
    console.log("data:", data);
    const result = await this.subscriptionService.subscriptionOrder(data);
    return await this.subscriptionService.subscriptionPayment({
      amount: result.amount,
      currency: result.currency,
      orderId: result.orderId,
      customer: {
        userId: data.customer.userId,
        name: data.customer.name,
        email: data.customer.email,
        contact: data.customer.contact,
      },
    });
  }

  @GrpcMethod("Subscriptionservice", "SubscriptionCheck")
  async handleSubscriptionPaymentCheck(@Payload() data: { id: string }) {
    return await this.subscriptionService.subscriptionPaymentCheck(data.id);
  }

  @GrpcMethod("Subscriptionservice", "GetAllSubscriber")
  async handleGetAllSubscriber() {
    return await this.subscriptionService.getAllSubscriber();
  }
}
