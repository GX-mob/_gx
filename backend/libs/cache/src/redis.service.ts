import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import IORedis, { Redis } from "ioredis";

@Injectable()
export class RedisService {
  public readonly client: Redis;
  constructor(private configService: ConfigService<{ REDIS_URI: string }>) {
    const redis_uri = this.configService.get("REDIS_URI");
    this.client = new IORedis(redis_uri);
  }
}
