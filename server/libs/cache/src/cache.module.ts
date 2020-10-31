import { Global, Module, OnModuleInit } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { CacheService } from "./cache.service";
import { RedisService } from "./redis.service";

@Global()
@Module({
  imports: [],
  providers: [RedisService, CacheService],
  exports: [RedisService, CacheService],
})
export class CacheModule implements OnModuleInit {
  constructor(private redisService: RedisService, private logger: PinoLogger) {
    logger.setContext(CacheModule.name);
  }
  onModuleInit() {
    const { client } = this.redisService;

    client.on("connect", () => this.logger.info("Redis connected"));
    client.on("reconnecting", () => this.logger.info("Redis reconnecting"));
    client.on("close", () => this.logger.info("Redis closed"));
    client.on("error", (error) => {
      this.logger.error("Redis error", error);
    });
  }
}
