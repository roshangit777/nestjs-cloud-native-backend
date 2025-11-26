import { Module } from "@nestjs/common";
import { PostService } from "./post.service";
import { PostController } from "./post.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppModule } from "./app.module";
import { Posts } from "./entity/post.entity";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Module({
  imports: [
    AppModule,
    TypeOrmModule.forFeature([Posts]),
    ClientsModule.register([
      {
        name: "NOTIFICATION_RECORD_RMQ",
        transport: Transport.RMQ,
        options: {
          urls: ["amqp://guest:guest@localhost:5672"],
          queue: "notification_record_queue",
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
