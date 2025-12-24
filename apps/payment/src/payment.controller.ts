import { Controller } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { GrpcMethod, Payload } from "@nestjs/microservices";
import type { CreateOrder, PaymentCheck } from "./interfaces/payment.interface";

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
}
