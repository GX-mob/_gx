import { Injectable } from "@nestjs/common";

import { CacheService } from "@app/cache";

@Injectable()
export class AppService {
  constructor(private readonly cacheService: CacheService) {}

  async getHello(): Promise<string> {
    const foo = await this.cacheService.get("foo", "bar");

    return `Hello World Mono!${foo}@`;
  }
}
