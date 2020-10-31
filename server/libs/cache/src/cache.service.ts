import { Injectable } from "@nestjs/common";
import { Redis } from "ioredis";
import {
  DEFAULT_TTL,
  LINK_PREFIX,
  SEPARATOR,
  AUTO_RETRY_ATTEMPS,
  AUTO_RETRY_INTERVAL_MS,
} from "./constants";
import { RedisService } from "./redis.service";
import { util } from "@app/helpers";

export type setOptions = {
  /**
   * Retry over fail
   * @default true
   */
  autoReTry?: boolean;
  ex?: number;
  link?: string[];
};

@Injectable()
export class CacheService {
  static KeySeparator = SEPARATOR;
  static KeyLinkPrefix = LINK_PREFIX;

  private defaultLifetime = String(DEFAULT_TTL);
  readonly redis: Redis;

  constructor(private redisService: RedisService) {
    this.redis = this.redisService.client;
  }

  /**
   * Get cache item
   * @param ns Key namespace
   * @param key Key name
   * @returns Value cached or null
   */
  async get(
    ns: string,
    key: any,
    { autoReTry = true }: Pick<setOptions, "autoReTry"> = {},
  ): Promise<any> {
    const finalKey = this.key(ns, key);
    const data = await this.execute("get", autoReTry, finalKey);

    if (!data) {
      return null;
    }

    if (this.isLink(data)) {
      return this.get(...this.getParentKey(data), { autoReTry });
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
   * @param options.autoReTry Auto retry
   * @default true
   * @param options.ex Expiration in ms
   * @param options.link Link keys list
   */
  async set(ns: string, key: any, value: any, options?: setOptions) {
    const parentKey = this.key(ns, key);
    const { ex, link, autoReTry = true } = options || {};

    value = JSON.stringify(value);

    const expiration = ex ? String(ex) : this.defaultLifetime;

    if (!link) {
      return this.execute("set", autoReTry, parentKey, value, "PX", expiration);
    }

    return util.retry(
      () =>
        this.redisService
          .multi([
            // Set the parent key, that have the value
            ["set", parentKey, value, "PX", expiration],
            // And linked keys
            ...link.map((childKey) => [
              "set",
              this.key(ns, childKey),
              `${LINK_PREFIX}${parentKey}`,
            ]),
          ])
          .exec(),
      options?.autoReTry ? AUTO_RETRY_ATTEMPS : 0,
      AUTO_RETRY_INTERVAL_MS,
    );
  }

  /**
   * Delete cached value
   * @param namespace
   * @param key
   */
  del(
    namespace: string,
    key: any,
    { autoReTry = true }: Pick<setOptions, "autoReTry"> = {},
  ) {
    const finalKey = this.key(namespace, key);

    return this.execute("del", autoReTry, finalKey);
  }

  public execute<K extends keyof Omit<RedisService, "client">>(
    cmd: K,
    retry: boolean,
    ...args: Parameters<RedisService[K]>
  ): ReturnType<RedisService[K]> {
    const command = this.redisService[cmd] as any;
    return retry
      ? util.retry(
          () => command.apply(this.redisService, args),
          AUTO_RETRY_ATTEMPS,
          AUTO_RETRY_INTERVAL_MS,
        )
      : command.apply(this.redisService, args);
  }

  /*
  private execute<K extends keyof Commands>(
    cmd: K,
    args: Parameters<Commands[K]>,
    retry: boolean,
  ): ReturnType<Commands[K]> {
    return retry
      ? util.retry(
          () => (this.redis as any)[cmd](...args),
          AUTO_RETRY_ATTEMPS,
          AUTO_RETRY_INTERVAL_MS,
        )
      : (this.redis as any)[cmd](...args);
  }
  */
}
