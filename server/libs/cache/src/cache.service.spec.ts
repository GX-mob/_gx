/**
 * Cache Service
 *
 * @group unit/services/cache
 */
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { CacheService } from "./cache.service";
import { RedisService } from "./redis.service";

describe("CacheService", () => {
  let service: CacheService;

  const mockObject = { foo: "bar", bar: 12 };

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

  it("should make keys linkings", async () => {
    const storeValue = "linking";
    await service.set("foo", "foobar", storeValue, { link: ["raboof"] });

    const linked = await service.get("foo", "raboof");

    expect(linked).toBe(storeValue);
  });
});
