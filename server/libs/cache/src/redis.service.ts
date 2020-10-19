import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import IORedis, { Redis } from "ioredis";

@Injectable()
export class RedisService {
  public readonly client: Redis;
  constructor(private configService: ConfigService<{ REDIS_URI: string }>) {
    const redis_uri = this.configService.get("REDIS_URI");

    if (!redis_uri && process.env.NODE_ENV !== "production") {
      //@ts-ignore
      this.client = new (require("ioredis-mock"))();
      return;
    }

    this.client = new IORedis(redis_uri);
  }

  public multi(commands: string[][]) {
    return this.client.multi(commands);
  }

  public get(key: string) {
    return this.client.get(key);
  }

  public set(key: string, value: string, ...extras: string[]) {
    return this.client.set(key, value, ...extras);
  }

  public del(key: string | string[]) {
    return typeof key === "string"
      ? this.client.del(key)
      : this.client.del(...key);
  }
}
