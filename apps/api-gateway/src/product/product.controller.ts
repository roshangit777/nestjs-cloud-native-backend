import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { OrderDto } from "./Dtos/orderDto";
import { AuthGuard } from "apps/common/guards/auth.guard";
import { CurrentUser } from "apps/common/decorators/current-user.decorator";

interface UserPayload {
  sub: number;
  email: string;
  role: string;
  name: string;
}

@Controller("product")
export class ProductController implements OnModuleInit {
  private productServices: any;
  constructor(@Inject("PRODUCT_CLIENT") private productClient: ClientGrpc) {}

  onModuleInit() {
    this.productServices = this.productClient.getService("productService");
  }

  @UseGuards(AuthGuard)
  @Get("images")
  getProduct() {
    return this.productServices.GetAllProduct({});
  }

  @UseGuards(AuthGuard)
  @Post("images/buy")
  purchaseProduct(@Body() data: OrderDto, @CurrentUser() user: UserPayload) {
    return this.productServices.CreateOrder({
      amount: data.amount,
      currency: data.currency,
      userId: user.sub,
      productId: data.productId,
      customerEmail: user.email,
      customerName: user.name,
      customerNumber: data.number,
    });
  }
}
