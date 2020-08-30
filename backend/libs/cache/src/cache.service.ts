import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import IORedis, { Redis } from "ioredis";
import schemapack, { SchemaObject, Parser } from "schemapack";
import { DEFAULT_TTL, LINK_PREFIX, SEPARATOR } from "./constants";

type setOptions = {
  ex?: number;
  link?: string[];
};

@Injectable()
export class CacheService {
  private defaultLifetime = String(DEFAULT_TTL);
  public redis: Redis;
  public schemas: { [k: string]: Parser } = {};

  constructor(private configService: ConfigService<{ REDIS_URI: string }>) {
    this.redis =
      process.env.NODE_ENV === "prodution"
        ? new IORedis(this.configService.get("REDIS_URI"))
        : new (require("ioredis-mock"))();
  }

  /**
   * Build schema serialization
   * @param name schema namespace
   * @param structure schema structure
   */
  buildSchema<T = any>(name: string, structure: SchemaObject): Parser<T> {
    return (this.schemas[name] = schemapack.build<T>(structure));
  }

  /**
   * Get cache item
   * @param ns Key namespace
   * @param key Key name
   * @returns Value cached or null
   */
  async get(ns: string, key: any): Promise<any> {
    const finalKey = this.key(ns, key);
    const data = await this.redis.get(finalKey);

    if (!data) {
      return null;
    }

    if (this.isLink(data)) {
      return this.get(...this.getParentKey(data));
    }

    if (ns in this.schemas) {
      return data && this.schemas[ns].decode((data as unknown) as Buffer);
    }

    return JSON.parse(data);
  }

  private key(namespace: string, key: string) {
    key = this.sanitizeKey(key);
    return `${namespace}${SEPARATOR}${key}`;
  }

  private sanitizeKey(key: any) {
    return typeof key === "string" ? key : JSON.stringify(key);
  }

  private isLink(value: any) {
    return typeof value === "string" && value.startsWith(LINK_PREFIX);
  }

  private getParentKey(value: string): [string, string] {
    const parentKey = value.replace(LINK_PREFIX, "");
    const [namespace, key] = parentKey.split(SEPARATOR);
    return [namespace, key];
  }

  /**
   * Set cache value
   * @param ns Key namespace
   * @param key key name
   * @param value value to store
   * @param options
   * @param options.ex key expiration in ms
   * @param options.link link key list
   */
  async set(ns: string, key: any, value: any, options: setOptions = {}) {
    const parentKey = this.key(ns, key);

    value =
      ns in this.schemas
        ? this.schemas[ns].encode(value)
        : JSON.stringify(value);

    const ex = options.ex ? String(options.ex) : this.defaultLifetime;

    if (!options.link) {
      return this.redis.set(parentKey, value, "PX", ex);
    }

    return this.redis
      .multi([
        ["set", parentKey, value, "PX", ex],
        ...options.link.map(childKey => [
          "set",
          this.key(ns, childKey),
          `${LINK_PREFIX}${parentKey}`,
        ]),
      ])
      .exec();
  }

  /**
   * Delete cached value
   * @param ns Key namespace
   * @param key Key name
   */
  del(ns: string, key: any) {
    const finalKey = this.key(ns, key);

    return this.redis.del(finalKey);
  }
}
