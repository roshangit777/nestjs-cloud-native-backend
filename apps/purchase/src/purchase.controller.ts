import { Controller, Inject, OnModuleInit } from "@nestjs/common";
import { PurchaseService } from "./purchase.service";
import { type ClientGrpc, GrpcMethod, Payload } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Controller()
export class PurchaseController implements OnModuleInit {
  private fileUploadServices: any;
  constructor(
    private readonly purchaseService: PurchaseService,
    @Inject("FILE_UPLOAD_CLIENT") private fileUploadClient: ClientGrpc
  ) {}

  onModuleInit() {
    this.fileUploadServices =
      this.fileUploadClient.getService("FileUploadService");
  }

  @GrpcMethod("PurchaseService", "GetAllOrders")
  async handleGetAllOrders() {
    return this.purchaseService.getAllOrders();
  }

  @GrpcMethod("PurchaseService", "GetAllSuccessfullOrders")
  async handleGetAllSuccessfullOrders() {
    return this.purchaseService.getAllSuccessfullOrders();
  }

  @GrpcMethod("PurchaseService", "GetAllUsersPurchase")
  async handleGetUserPurchases(@Payload() data: { id: string }) {
    const imgIds = await this.purchaseService.getUserPurchases(data.id);
    const result: any = await firstValueFrom(
      this.fileUploadServices.GetPurchasedFiles({
        ids: imgIds,
      })
    );
    return { files: result.files };
  }
}
