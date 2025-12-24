import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { S3Service } from "./aws-s3.service";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), JwtModule.register({})],
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {}
