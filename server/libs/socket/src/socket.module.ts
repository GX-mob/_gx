import { Module } from "@nestjs/common";
import { SocketService } from "./socket.service";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ConfigModule],
  providers: [SocketService],
  exports: [SocketService],
})
export class SocketModule {}
