import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { type ClientGrpc } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";
import {
  SubscriptionData,
  SubscriptionOrderResponse,
} from "./interface/subscription.interface";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Subscription,
  SubscriptionPayment,
} from "./entity/subscription.entity";
import { Repository } from "typeorm";
import { RedisService } from "apps/libs/infra/redis/redis.service";

@Injectable()
export class SubscriptionService implements OnModuleInit {
  private paymentServices: any;
  constructor(
    @Inject("PAYMENT_CLIENT") private paymentClient: ClientGrpc,
    @InjectRepository(Subscription)
    private readonly subcriptionClient: Repository<Subscription>,
    @InjectRepository(SubscriptionPayment)
    private readonly subcriptionPaymentClient: Repository<SubscriptionPayment>,
    private readonly redisClient: RedisService
  ) {}
  onModuleInit() {
    this.paymentServices = this.paymentClient.getService("PaymentService");
  }

  async subscriptionOrder(
    data: SubscriptionData
  ): Promise<SubscriptionOrderResponse> {
    const result = await lastValueFrom<SubscriptionOrderResponse>(
      this.paymentServices.CreateSubscriptionOrder({
        amount: data.amount,
        currency: data.currency,
        userId: data.customer.userId,
      })
    );

    const newSubscription = this.subcriptionClient.create({
      userId: data.customer.userId,
      name: data.customer.name,
      email: data.customer.email,
      orderId: result.id,
      price: result.amount,
      currency: result.currency,
      receipt: result.receipt,
      status: result.status,
    });

    await this.subcriptionClient.save(newSubscription);

    return { ...result, orderId: newSubscription.id };
  }

  async subscriptionPayment(data: SubscriptionData) {
    const result = await lastValueFrom<any>(
      this.paymentServices.CreateSubscriptionPayment(data)
    );

    const newPayment = this.subcriptionPaymentClient.create({
      orderId: data.orderId,
      razorpayPaymentId: result.id,
      status: result.status,
      amount: result.amount,
      currency: result.currency,
      customer: result.customer,
      rawPaymentResponse: result,
    });

    await this.subcriptionPaymentClient.save(newPayment);

    return result;
  }

  async subscriptionPaymentCheck(id: string) {
    const result = await lastValueFrom<any>(
      this.paymentServices.SubscriptionPaymentCheck({ data: id })
    );

    await this.subcriptionPaymentClient.update(
      { razorpayPaymentId: id },
      {
        razorpay_Confirmation_PaymentId: result.id,
        razorpayOrderId: result.orderId,
        status: result.status,
        method: result.method,
        rawPaymentSuccessResponse: result,
        transactionDetails: result.acquirerData,
      }
    );

    if (result.status === "captured" && result.captured === true) {
      const payment = await this.subcriptionPaymentClient.findOne({
        where: { razorpayPaymentId: id },
      });

      if (!payment) return result;

      const subscriber = await this.subcriptionClient.findOne({
        where: { id: payment.orderId },
      });

      if (!subscriber) return result;

      //Update DB (must succeed)
      await this.subcriptionClient.update(
        { id: payment.orderId },
        { paid: true }
      );

      //Update Redis (best effort)
      this.cacheSubscription(String(subscriber.userId));

      //Email (async / event-based)
      this.sendEmail(id);
    }

    return result;
  }

  async getAllSubscriber() {
    const result = await this.subcriptionClient.find({});
    return { subscriber: result };
  }

  async cacheSubscription(userId: string) {
    try {
      await this.redisClient.set(
        `sub:${userId}`,
        {
          plan: "PRO",
          expiresAt: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        60 * 60 * 24 * 30
      );
    } catch (err) {
      console.error("Redis subscription cache failed", err);
    }
  }

  async sendEmail(id: string) {
    try {
      const payment = await this.subcriptionPaymentClient.findOne({
        where: { razorpayPaymentId: id },
      });

      if (!payment) return;

      const order = await this.subcriptionClient.findOne({
        where: { id: payment.orderId },
      });

      if (!order?.email) return;

      const bodyData = {
        toEmail: order.email,
        userName: order.name,
        orderId: order.orderId,
        amount: order.price,
        transactionDetails: payment.transactionDetails,
        dataAndTime: payment.updatedAt,
      };

      fetch(
        "https://wd2fdsn2mf.execute-api.us-east-1.amazonaws.com/send-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyData),
        }
      ).catch(() => {
        // silently ignore errors
      });
    } catch (err) {
      // never break main flow
    }
  }
}
