import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ApiGatewayController } from "./api-gateway.controller";
import { ApiGatewayService } from "./api-gateway.service";
import { AuthModule } from "./auth/auth.module";
import { PostModule } from "./post/post.module";
import { FileUploadModule } from "./file-upload/file-upload.module";
import { JwtModule } from "@nestjs/jwt";
import { LoginHistoryModule } from "./login-history/login-history.module";
import { NotificationModule } from "./notification/notification.module";
import { ProductModule } from "./product/product.module";
import { PaymentModule } from "./payment/payment.module";
import { PurchaseModule } from "./purchase/purchase.module";
import { VideoUploadModule } from "./video-upload/video-upload.module";
import { SubscriptionModule } from "./subscription/subscription.module";
import { RedisModule } from "apps/libs/infra/redis/redis.module";
import { ThrottlerModule } from "@nestjs/throttler";
import { CorrelationMiddleware } from "./middlewares/correlation.middleware";

@Module({
  imports: [
    AuthModule,
    PostModule,
    FileUploadModule,
    JwtModule.register({
      global: true,
    }),
    LoginHistoryModule,
    NotificationModule,
    ProductModule,
    PaymentModule,
    PurchaseModule,
    VideoUploadModule,
    SubscriptionModule,
    RedisModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 5,
        },
      ],
    }),
  ],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationMiddleware).forRoutes("*");
  }
}
