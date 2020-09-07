import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SocketModule, SocketService } from "@app/socket";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".development.env",
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
