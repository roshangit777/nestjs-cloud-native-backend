import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MessageType, Notification } from "./entity/notification.entity";
import { Repository } from "typeorm";
import { ClientProxy, RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";
import { AppLogger } from "apps/common/logger/logger.service";

export interface NotificationStructure {
  userId: number;
  type: MessageType;
  title: string;
  message: string;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private readonly logger: AppLogger,
    @Inject("NOTIFICATION_RMQ") private notificationClient: ClientProxy
  ) {}

  async saveUserNotifications(data: NotificationStructure) {
    this.logger.logEvent({
      event: "SAVE_NOTIFICATION",
      status: "START",
      userId: data.userId,
    });
    try {
      const result: Notification = this.notificationRepository.create({
        user: Number(data.userId),
        title: data.title,
        message: data.message,
        type: data.type,
      });
      await this.notificationRepository.save(result);
      this.notificationClient.emit("broadcast_notification", { ...result });
      this.logger.logEvent({
        event: "SAVE_NOTIFICATION",
        status: "SUCCESS",
        userId: data.userId,
      });
    } catch (error) {
      this.logger.errorEvent({
        event: "SAVE_NOTIFICATION",
        status: "FAILED",
        userId: data.userId,
        error: error.message,
        stack: error.stack,
      });
    }
  }

  async userNotification(id: number) {
    const result = await this.notificationRepository.find({
      where: { user: id },
    });
    if (result.length === 0) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: "Notification doesn't exist",
      });
    }
    return result;
  }

  async updateUserNotification(id: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id: id },
    });
    if (!notification) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: "Notification doesn't exist",
      });
    }
    await this.notificationRepository.update({ id }, { isRead: true });
  }
}
