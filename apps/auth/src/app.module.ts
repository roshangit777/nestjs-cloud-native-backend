import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
/* import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerModule } from "@nestjs/throttler"; */
import { Users } from "./entities/user.entity";
import { Roles } from "./entities/roles.entity";
import { UserRoleMap } from "./entities/user-role-map.entity";

@Module({
  imports: [
    /* TypeOrmModule.forRoot({
      type: "postgres",
      host: "database-1.cdmm6046orkw.eu-north-1.rds.amazonaws.com",
      port: 5432,
      username: "postgres",
      password: "rootroot",
      database: "authdb",
      ssl: {
        rejectUnauthorized: false,
      },
      extra: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
      autoLoadEntities: true,
      synchronize: true,
    }), */

    TypeOrmModule.forRoot({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "postgres", // your pgAdmin username
      password: "root", // your pgAdmin password
      database: "nestjs_auth", // the database you created
      autoLoadEntities: true,
      synchronize: true, // only for development
      entities: [Users, Roles, UserRoleMap],
    }),

    /*  ConfigModule.forRoot({
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

/*
version: "3.9"

services:
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest

  api-gateway:
    build:
      context: .
      dockerfile: apps/api-gateway/src/Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - auth
      - post # ← added new service here
      - login-history # ← added new service here
      - file-upload # ← added new service here
      - notification
    environment:
      AUTH_HOST: auth
      AUTH_PORT: 50052
      POST_HOST: post # ← add new env
      POST_PORT: 50051 # ← add new env
      HISTORY_HOST: login-history # ← add new env
      HISTORY_PORT: 50054 # ← add new env
      FILE_UPLOAD_HOST: file-upload # ← add new env
      FILE_UPLOAD_PORT: 50053 # ← add new env
      NOTIFICATION_HOST: notification # ← add new env
      NOTIFICATION_PORT: 50055 # ← add new env

  auth:
    build:
      context: .
      dockerfile: apps/auth/src/Dockerfile
    ports:
      - "50052:50052"

  post:
    build:
      context: .
      dockerfile: apps/post/src/Dockerfile
    ports:
      - "50051:50051"

  login-history:
    build:
      context: .
      dockerfile: apps/login-history/src/Dockerfile
    ports:
      - "50054:50054"

  file-upload:
    build:
      context: .
      dockerfile: apps/file-upload/src/Dockerfile
    ports:
      - "50053:50053"

  notification:
    build:
      context: .
      dockerfile: apps/notification/src/Dockerfile
    ports:
      - "50055:50055"

*/
