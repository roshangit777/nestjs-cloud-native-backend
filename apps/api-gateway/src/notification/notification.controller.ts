import {
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  MessagePattern,
  Payload,
  type ClientGrpc,
} from "@nestjs/microservices";
import { WebsocketGateway } from "./websocket.gateway";
import type { NotificationStructure } from "./interface/notificationStructure.interface";
/* import { AuthGuard } from "apps/common/guards/auth.guard"; */

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

@Controller("notification")
export class NotificationController implements OnModuleInit {
  private notificationService: any;
  constructor(
    @Inject("NOTIFICATION_CLIENT") private notificationClient: ClientGrpc,
    private websocketGateway: WebsocketGateway
  ) {}

  onModuleInit() {
    this.notificationService =
      this.notificationClient.getService("Notification");
  }

  @MessagePattern("broadcast_notification")
  handleNotification(@Payload() data: NotificationStructure) {
    this.websocketGateway.sendToUser(data.user, {
      type: data.type,
      title: data.title,
      message: data.message,
      time: data.createdAt,
    });
  }

  @Get("create")
  createNotification() {
    console.log("This is from api/gateway/notification/Controller");
    return this.notificationService.AddNotification({
      id: 2,
    });
  }

  @Get("get/:id")
  getNotification(@Param("id") id: number) {
    return this.notificationService.GetNotification({
      id: Number(id),
    });
  }

  @Put("update/:id")
  updateNotification(@Param("id") id: number) {
    console.log(id);
    return this.notificationService.UpdateNotification({
      id: Number(id),
    });
  }
}
