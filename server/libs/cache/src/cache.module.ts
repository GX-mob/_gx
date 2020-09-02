import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CacheService } from "./cache.service";
import { RedisService } from "./redis.service";

@Module({
  imports: [ConfigModule],
  providers: [RedisService, CacheService],
  exports: [RedisService, CacheService],
})
export class CacheModule {}
