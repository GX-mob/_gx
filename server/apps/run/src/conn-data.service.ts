import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { Connection } from "./events/schemas/common";
import { CACHE_NAMESPACES, CACHE_TTL } from "./constants";

@Injectable()
export class ConnectionDataService {
  constructor(readonly cacheService: CacheService) {}

  /**
   * Get connection data
   * @param id Socket ID or User public ID
   */
  public get(id: string): Promise<Connection> {
    return this.cacheService.get(CACHE_NAMESPACES.CONNECTIONS, id);
  }

  /**
   * Set connection data
   * @param pid User public ID
   * @param data
   */
  public async set(pid: string, data: Connection): Promise<Connection> {
    const previousData = await this.cacheService.get(
      CACHE_NAMESPACES.CONNECTIONS,
      pid,
    );

    const newData = { ...previousData, ...data };

    await this.cacheService.set(CACHE_NAMESPACES.CONNECTIONS, pid, newData, {
      link: ["socketId"],
      ex: CACHE_TTL.CONNECTIONS,
    });
    return newData;
  }
}
