import {
  Controller,
  Get,
  Inject,
  OnModuleInit,
  UseGuards,
} from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { CurrentUser } from "apps/common/decorators/current-user.decorator";
import { Roles } from "apps/common/decorators/roles.decorator";
import { AuthGuard } from "apps/common/guards/auth.guard";
import { RolesGuard, UserRole } from "apps/common/guards/roles.guard";

interface UserPayload {
  sub: number;
  email: string;
  role: string;
  name: string;
}

@Controller("purchase")
export class PurchaseController implements OnModuleInit {
  private purchaseServices: any;
  constructor(@Inject("PURCHASE_CLIENT") private purchaseClient: ClientGrpc) {}

  onModuleInit() {
    this.purchaseServices = this.purchaseClient.getService("PurchaseService");
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @Get("orders")
  getAllOrders() {
    return this.purchaseServices.GetAllOrders({});
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @Get("orders/paid")
  getAllSuccessfullOrders() {
    return this.purchaseServices.GetAllSuccessfullOrders({});
  }

  @UseGuards(AuthGuard)
  @Get("my-purchases")
  getAllUserPurchases(@CurrentUser() user: UserPayload) {
    console.log("hitting api-gateway for purchases:", user.sub);
    return this.purchaseServices.GetAllUsersPurchase({ id: user.sub });
  }
}
