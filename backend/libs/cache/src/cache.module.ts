import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CacheService } from "./cache.service";

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
