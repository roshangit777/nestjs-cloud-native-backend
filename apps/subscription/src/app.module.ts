import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import {
  Subscription,
  SubscriptionPayment,
} from "./entity/subscription.entity";
/* import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerModule } from "@nestjs/throttler"; */

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "postgres", // your pgAdmin username
      password: "root", // your pgAdmin password
      database: "nestjs_subscription", // the database you created
      autoLoadEntities: true,
      synchronize: true, // only for development
      entities: [Subscription, SubscriptionPayment],
    }),
    JwtModule.register({ global: true }),
    /* ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }), */
    /* EventEmitterModule.forRoot({
      global: true,
      wildcard: false,
      maxListeners: 20,
      verboseMemoryLeak: true,
    }), */
    /* ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 5,
        },
      ],
    }), */
  ],
})
export class AppModule {}
