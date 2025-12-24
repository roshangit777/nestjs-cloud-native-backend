import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { Video } from "./entity/videoUpload.entity";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "postgres", // your pgAdmin username
      password: "root", // your pgAdmin password
      database: "nestjs_videoUpload", // the database you created
      autoLoadEntities: true,
      synchronize: true, // only for development
      entities: [Video],
    }),
    JwtModule.register({ global: true }),
  ],
})
export class AppModule {}
