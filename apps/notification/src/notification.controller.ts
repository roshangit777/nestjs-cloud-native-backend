import { Controller } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { GrpcMethod, MessagePattern, Payload } from "@nestjs/microservices";
import { MessageType } from "./entity/notification.entity";

export interface NotificationStructure {
  userId: number;
  type: MessageType;
  title: string;
  message: string;
}

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @MessagePattern("record_notification")
  async saveNotification(@Payload() data: NotificationStructure) {
    console.log("This is from notification/Controller");
    await this.notificationService.saveUserNotifications(data);
  }

  @GrpcMethod("Notification", "GetNotification")
  async getUserNotification(@Payload() userId: { id: number }) {
    const result = await this.notificationService.userNotification(userId.id);
    return { notifications: result };
  }

  @GrpcMethod("Notification", "UpdateNotification")
  async updateNotificationRead(@Payload() notificationId: { id: number }) {
    await this.notificationService.updateUserNotification(notificationId.id);
  }
}
