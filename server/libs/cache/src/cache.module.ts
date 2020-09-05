import { Module } from "@nestjs/common";
import { CacheService } from "./cache.service";
import { RedisService } from "./redis.service";

@Module({
  imports: [],
  providers: [RedisService, CacheService],
  exports: [RedisService, CacheService],
})
export class CacheModule {}
