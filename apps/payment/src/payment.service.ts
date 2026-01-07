import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy, RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";
import { InjectRepository } from "@nestjs/typeorm";
import { Orders, Payment } from "./entity/payment.entity";
import { Repository } from "typeorm";
import {
  CreateOrder,
  PaymentCheck,
  SubscriptionOrder,
  SubscriptionPayment,
} from "./interfaces/payment.interface";

@Injectable()
export class PaymentService {
  private testApiKey: string;
  private testApiSecret: string;

  constructor(
    @InjectRepository(Orders)
    private readonly ordersRepository: Repository<Orders>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @Inject("NOTIFICATION_RECORD_RMQ") private notificationClient: ClientProxy
  ) {
    this.testApiKey = process.env.Test_API_Key ?? "";
    this.testApiSecret = process.env.Test_Key_Secret ?? "";
  }

  async createOrder(data: CreateOrder) {
    const orderData = {
      amount: data.amount,
      currency: data.currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: data.userId,
        productId: data.productId,
      },
    };
    const auth = btoa(`${this.testApiKey}:${this.testApiSecret}`);

    //Razorpay order creation
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new RpcException({
        code: status.INTERNAL,
        message: "Error to create order",
      });
    }

    const result = await response.json();

    const newOrder = this.ordersRepository.create({
      userId: Number(data.userId),
      name: data.customerName,
      email: data.customerEmail,
      fileId: data.productId,
      number: data.customerNumber,
      orderId: result.id,
      price: result.amount,
      currency: result.currency,
      entity: result.entity,
      receipt: result.receipt,
    });

    const res = await this.ordersRepository.save(newOrder);

    return {
      id: res.id,
      name: res.name,
      email: res.email,
      number: res.number,
      currency: res.currency,
      amount: res.price,
    };
  }

  async createPayment(data: PaymentCheck) {
    const auth = btoa(`${this.testApiKey}:${this.testApiSecret}`);

    const paymentDetails = {
      amount: Number(data.amount) * 100,
      currency: data.currency,
      description: "Test payment",
      customer: {
        contact: data.number,
        email: data.email,
        name: data.name,
      },
      notify: {
        sms: true,
        email: true,
      },
    };

    const response = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(paymentDetails),
    });

    if (!response.ok) {
      throw new RpcException({
        code: status.INTERNAL,
        message: "Error to create Payment",
      });
    }

    const result = await response.json();

    const newPayment = this.paymentRepository.create({
      orderId: data.id,
      razorpayPaymentId: result.id,
      status: result.status,
      amount: result.amount,
      currency: result.currency,
      customer: result.customer,
      rawPaymentResponse: result,
    });

    await this.paymentRepository.save(newPayment);

    return {
      acceptPartial: result.accept_partial,
      amount: result.amount,
      amountPaid: result.amount_paid,
      cancelledAt: result.cancelled_at,
      createdAt: result.created_at,
      currency: result.currency,
      customer: result.customer,
      description: result.description,
      expireBy: result.expire_by,
      expiredAt: result.expired_at,
      firstMinPartialAmount: result.first_min_partial_amount,
      id: result.id,
      notes: result.notes ?? "",
      notify: result.notify,
      payments: result.payments ?? "",
      referenceId: result.reference_id,
      reminderEnable: result.reminder_enable,
      reminders: result.reminders,
      shortUrl: result.short_url,
      status: result.status,
      updatedAt: result.updated_at,
      upiLink: result.upi_link,
      userId: result.user_id,
      whatsappLink: result.whatsapp_link,
    };
  }

  async paymentCheck(id: string) {
    const auth = btoa(`${this.testApiKey}:${this.testApiSecret}`);

    const linkResponse = await fetch(
      `https://api.razorpay.com/v1/payment_links/${id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!linkResponse.ok) {
      throw new RpcException({
        code: status.INTERNAL,
        message: "Failed to fetch payment link details 1",
      });
    }

    const linkData = await linkResponse.json();

    const paymentId = linkData?.payments?.[0]?.payment_id;

    const response = await fetch(
      `https://api.razorpay.com/v1/payments/${paymentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!response.ok) {
      throw new RpcException({
        code: status.INTERNAL,
        message: "Failed to fetch payment details 2",
      });
    }

    const result = await response.json();

    await this.paymentRepository.update(
      { razorpayPaymentId: id },
      {
        razorpay_Confirmation_PaymentId: result.id,
        razorpayOrderId: result.order_id,
        status: result.status,
        method: result.method,
        rawPaymentSuccessResponse: result,
        paidAt: new Date().toLocaleString(),
        transactionDetails: result.acquirer_data,
        updatedAt: new Date().toLocaleString(),
      }
    );

    if (result.status === "captured" && result.captured === true) {
      try {
        const payment: any = await this.paymentRepository.findOne({
          where: { razorpayPaymentId: id },
        });

        await this.ordersRepository.update(
          { id: payment.orderId },
          { paid: true }
        );
      } catch (error) {
        console.log(
          "Error updating Status in the Payment check",
          error.message
        );
        throw new RpcException({
          code: status.INTERNAL,
          message: "Failed to update order status",
        });
      }
    }

    this.sendEmail(id);

    return {
      id: result.id,
      entity: result.entity,
      amount: result.amount / 100,
      currency: result.currency,
      status: result.status,
      orderId: result.order_id,
      invoiceId: result.invoice_id ?? "",
      international: result.international,
      method: result.method,
      amountRefunded: result.amount_refunded,
      refundStatus: result.refund_status ?? "",
      captured: result.captured,
      description: result.description,
      cardId: result.card_id ?? "",
      bank: result.bank ?? "",
      wallet: result.wallet ?? "",
      vpa: result.vpa,
      email: result.email,
      contact: result.contact,
      notes: result.notes,
      fee: result.fee,
      tax: result.tax,
      errorCode: result.error_code ?? "",
      errorDescription: result.error_description ?? "",
      errorSource: result.error_source ?? "",
      errorStep: result.error_step ?? "",
      errorReason: result.error_reason ?? "",
      acquirerData: {
        rrn: result.acquirer_data.rrn,
        upiTransactionId: result.acquirer_data.upi_transaction_id,
      },
      createdAt: result.created_at,
      upi: result.upi,
    };
  }

  /* async updateOrder(id: string) {
    const payment = await this.paymentRepository.findOne({
      where: { razorpayPaymentId: id },
    });

    if (!payment) return;

    await this.ordersRepository.update({ id: payment.orderId }, { paid: true });
  } */

  async sendEmail(id: string) {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { razorpayPaymentId: id },
      });

      if (!payment) return;

      const order = await this.ordersRepository.findOne({
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

  async subscriptionOrder(data: SubscriptionOrder) {
    const orderData = {
      amount: data.amount,
      currency: data.currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: data.userId,
      },
    };
    const auth = btoa(`${this.testApiKey}:${this.testApiSecret}`);

    //Razorpay order creation
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new RpcException({
        code: status.INTERNAL,
        message: "Error to create order",
      });
    }

    const result = await response.json();

    console.log("result 1 from payment service:", result);

    return {
      amount: result.amount,
      currency: result.currency,
      id: result.id,
      receipt: result.receipt,
      status: result.status,
    };
  }

  async createSubscriptionPayment(data: SubscriptionPayment) {
    const auth = btoa(`${this.testApiKey}:${this.testApiSecret}`);

    const paymentDetails = {
      amount: Number(data.amount) * 100,
      currency: data.currency,
      description: "Test payment",
      customer: {
        contact: data.customer.contact,
        email: data.customer.email,
        name: data.customer.name,
      },
      notify: {
        sms: true,
        email: true,
      },
    };

    const response = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(paymentDetails),
    });

    if (!response.ok) {
      throw new RpcException({
        code: status.INTERNAL,
        message: "Error to create Payment",
      });
    }

    const result = await response.json();

    return {
      acceptPartial: result.accept_partial,
      amount: result.amount,
      amountPaid: result.amount_paid,
      cancelledAt: result.cancelled_at,
      createdAt: result.created_at,
      currency: result.currency,
      customer: result.customer,
      description: result.description,
      expireBy: result.expire_by,
      expiredAt: result.expired_at,
      firstMinPartialAmount: result.first_min_partial_amount,
      id: result.id,
      notes: result.notes ?? "",
      notify: result.notify,
      payments: result.payments ?? "",
      referenceId: result.reference_id,
      reminderEnable: result.reminder_enable,
      reminders: result.reminders,
      shortUrl: result.short_url,
      status: result.status,
      updatedAt: result.updated_at,
      upiLink: result.upi_link,
      userId: result.user_id,
      whatsappLink: result.whatsapp_link,
    };
  }

  async subscriptionPaymentCheck(id: string) {
    const auth = btoa(`${this.testApiKey}:${this.testApiSecret}`);

    const linkResponse = await fetch(
      `https://api.razorpay.com/v1/payment_links/${id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!linkResponse.ok) {
      throw new RpcException({
        code: status.INTERNAL,
        message: "Failed to fetch payment link details 1",
      });
    }

    const linkData = await linkResponse.json();

    const paymentId = linkData?.payments?.[0]?.payment_id;

    const response = await fetch(
      `https://api.razorpay.com/v1/payments/${paymentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!response.ok) {
      throw new RpcException({
        code: status.INTERNAL,
        message: "Failed to fetch payment details 2",
      });
    }

    const result = await response.json();

    return {
      id: result.id,
      entity: result.entity,
      amount: result.amount / 100,
      currency: result.currency,
      status: result.status,
      orderId: result.order_id,
      invoiceId: result.invoice_id ?? "",
      international: result.international,
      method: result.method,
      amountRefunded: result.amount_refunded,
      refundStatus: result.refund_status ?? "",
      captured: result.captured,
      description: result.description,
      cardId: result.card_id ?? "",
      bank: result.bank ?? "",
      wallet: result.wallet ?? "",
      vpa: result.vpa,
      email: result.email,
      contact: result.contact,
      notes: result.notes,
      fee: result.fee,
      tax: result.tax,
      errorCode: result.error_code ?? "",
      errorDescription: result.error_description ?? "",
      errorSource: result.error_source ?? "",
      errorStep: result.error_step ?? "",
      errorReason: result.error_reason ?? "",
      acquirerData: {
        rrn: result.acquirer_data.rrn,
        upiTransactionId: result.acquirer_data.upi_transaction_id,
      },
      createdAt: result.created_at,
      upi: result.upi,
    };
  }
}
