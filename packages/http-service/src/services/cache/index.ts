/**
 * GX - Corridas
 * Copyright (C) 2020  Fernando Costa
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { FastifyInstanceToken, Inject, Service } from "fastify-decorators";
import { Redis } from "ioredis";
import schemapack, { SchemaObject, Parser } from "schemapack";
import { FastifyInstance } from "fastify";

type setOptions = {
  ex?: number;
  link?: string[];
};

/**
 * Cache abstraction
 * First encode/decode by pre built schemapack and fallback to JSON serialization
 */
@Service()
export class CacheService {
  @Inject(FastifyInstanceToken)
  public instance!: FastifyInstance;

  private linkPrefix = "__linked@";
  private separator = ":::";

  public redis: Redis = this.instance.redis;
  public defaultLifetime = String(15 * 60 * 1000);
  public schemas: { [k: string]: Parser } = {};
  private schemasStructure: { [k: string]: any } = {};

  /**
   * Build schema serialization
   * @param name schema namespace
   * @param structure schema structure
   */
  buildSchema<T = any>(name: string, structure: SchemaObject): Parser<T> {
    this.schemasStructure[name] = structure;
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
    return `${namespace}${this.separator}${key}`;
  }

  private sanitizeKey(key: any) {
    return typeof key === "string" ? key : JSON.stringify(key);
  }

  private isLink(value: any) {
    return typeof value === "string" && value.startsWith(this.linkPrefix);
  }

  private getParentKey(value: string): [string, string] {
    const parentKey = value.replace(this.linkPrefix, "");
    const [namespace, key] = parentKey.split(this.separator);
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
        ? this.schemas[ns].encode(this.sanitizeValue(ns, value))
        : JSON.stringify(value);

    const ex = options.ex ? String(options.ex) : this.defaultLifetime;

    if (options.link) {
      await this.redis
        .multi([
          ["set", parentKey, value, "PX", ex],
          ...options.link.map((childKey) => [
            "set",
            this.key(ns, childKey),
            `${this.linkPrefix}${parentKey}`,
          ]),
        ])
        .exec();

      return "OK";
    }

    await this.redis.set(parentKey, value, "PX", ex);

    return "OK";
  }

  sanitizeValue(ns: string, value: any) {
    const sanitized: { [k: string]: any } = {};

    for (const prop in this.schemasStructure[ns]) {
      sanitized[prop] = value[prop];
    }

    return sanitized;
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
