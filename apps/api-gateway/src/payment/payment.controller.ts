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
import { OrderDto } from "./Dto/orderDto";
import { CreatePaymentDto } from "./Dto/paymentDto";
import { AuthGuard } from "apps/common/guards/auth.guard";
import { CurrentUser } from "apps/common/decorators/current-user.decorator";
import type { CurrentUserInfo } from "./interfaces/payment.interface";

@Controller("payment")
export class PaymentController implements OnModuleInit {
  private paymentServices: any;
  constructor(@Inject("PAYMENT_CLIENT") private paymentClient: ClientGrpc) {}

  onModuleInit() {
    this.paymentServices = this.paymentClient.getService("PaymentService");
  }

  @UseGuards(AuthGuard)
  @Post("create-order")
  handleOrderCreation(
    @Body() data: OrderDto,
    @CurrentUser() user: CurrentUserInfo
  ) {
    return this.paymentServices.CreateOrder({
      amount: data.amount,
      currency: data.currency,
      userId: user.sub,
      productId: data.productId,
      customerEmail: user.email,
      customerName: user.name,
    });
  }

  @UseGuards(AuthGuard)
  @Post("create-payment")
  handlePaymentCreation(
    @Body() data: CreatePaymentDto,
    @CurrentUser() user: CurrentUserInfo
  ) {
    return this.paymentServices.CreatePayment({
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      customer: {
        userId: user.sub,
        name: user.name,
        email: user.email,
        contact: data.customer.contact,
      },
      orderId: data.orderId,
    });
  }

  @UseGuards(AuthGuard)
  @Get("payment-confirmation")
  handlePaymentCheck(@Query("id") data: string) {
    console.log(data);
    return this.paymentServices.PaymentCheck({ data });
  }
}
