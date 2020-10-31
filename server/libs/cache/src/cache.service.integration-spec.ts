/**
 * Cache Service
 *
 * @group integration/services/cache
 */
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { CacheService } from "./cache.service";
import { RedisService } from "./redis.service";

describe("CacheService", () => {
  let service: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [RedisService, CacheService],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("change default expiration time", async (done) => {
    await service.set("bar", "foo", 0, { ex: 1 });

    setTimeout(async () => {
      const value = await service.get("bar", "foo");
      expect(value).toBe(null);

      done();
    }, 2);
  });

  it("should do linking keys", async () => {
    const storeValue = "linking";
    const namespace = "foo";
    const parentKey = "foobar";
    const referenceLinkKey = "barfor";

    await service.set(namespace, parentKey, storeValue, {
      link: [referenceLinkKey],
    });

    const linked = await service.get(namespace, referenceLinkKey);

    expect(linked).toBe(storeValue);
  });
});
