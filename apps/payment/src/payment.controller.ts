import { Controller } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { GrpcMethod, Payload } from "@nestjs/microservices";
import type {
  CreateOrder,
  PaymentCheck,
  SubscriptionOrder,
  SubscriptionPayment,
} from "./interfaces/payment.interface";

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @GrpcMethod("PaymentService", "CreateOrder")
  async handleCreateOrder(@Payload() data: CreateOrder) {
    const result: PaymentCheck = await this.paymentService.createOrder(data);
    return await this.handleCreatePayment(result);
  }

  async handleCreatePayment(data: PaymentCheck) {
    return await this.paymentService.createPayment(data);
  }

  @GrpcMethod("PaymentService", "PaymentCheck")
  async handlePaymentCheck(@Payload() paymentID: { data: string }) {
    return await this.paymentService.paymentCheck(paymentID.data);
  }

  @GrpcMethod("PaymentService", "CreateSubscriptionOrder")
  async handleSubscriptionOrder(@Payload() data: SubscriptionOrder) {
    console.log("data hit it is from payment order controller:", data);
    return await this.paymentService.subscriptionOrder(data);
  }

  @GrpcMethod("PaymentService", "CreateSubscriptionPayment")
  async handleSubscriptionPayment(@Payload() data: SubscriptionPayment) {
    console.log("data hit in is from payment paymnet controller:", data);
    return await this.paymentService.createSubscriptionPayment(data);
  }

  @GrpcMethod("PaymentService", "SubscriptionPaymentCheck")
  async handleSubscriptionPaymentCheck(@Payload() paymentID: { data: string }) {
    return await this.paymentService.subscriptionPaymentCheck(paymentID.data);
  }
}
