/**
 * Data Service
 *
 * @group unit/services/data
 */
import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseModule, User, UserModel, Session } from "@app/database";
import { CacheModule, CacheService, RedisService } from "@app/cache";
import { DataService } from "./data.service";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
//@ts-ignore
import IORedisMock from "ioredis-mock";
import { generate } from "shortid";

describe("DataService", () => {
  let service: DataService;
  let cacheService: CacheService;
  let mongoServer: MongoMemoryServer;

  const mockUser = {
    firstName: "First",
    lastName: "Last",
    cpf: "123.456.789-09",
    phones: ["+5582988888888", "+5582988444445"],
    emails: [],
    birth: new Date("06/13/1994"),
    roles: ["voyager"],
  };

  const mockSession = {
    userAgent: "test",
    ips: ["127.0.0.1"],
  };

  let cached: any;
  let session: any;

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    process.env.DATABASE_URI = await mongoServer.getUri();
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, CacheModule],
      providers: [DataService],
    })
      .overrideProvider(RedisService)
      .useValue({ client: new IORedisMock() })
      .compile();

    service = module.get<DataService>(DataService);
    cacheService = module.get<CacheService>(CacheService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create", async () => {
    cached = await service.users.create(mockUser);

    expect(cached._id instanceof mongoose.Types.ObjectId).toBeTruthy();

    const persistent = (await service.users.get({ _id: cached._id })) as User;
    const fromCache = (await cacheService.get("users", {
      _id: cached._id,
    })) as User;

    expect(persistent.firstName).toBe(cached.firstName);
    expect(fromCache.firstName).toBe(cached.firstName);
    expect(fromCache).toMatchObject({
      ...mockUser,
      birth: mockUser.birth.toISOString(),
    });
  });

  it("should create and return populated", async () => {
    session = await service.sessions.create(
      {
        ...mockSession,
        user: cached._id,
      },
      { cache: false },
    );

    expect(session.userAgent).toBe(mockSession.userAgent);
    expect(session.user._id.toString()).toBe(cached._id.toString());
  });

  it("should get cached record", async () => {
    const user = (await service.users.get({ _id: cached._id })) as User;

    expect(user.cpf).toBe(cached.cpf);
  });

  it("should get non-cached record", async () => {
    const nonCached = await UserModel.create({
      ...mockUser,
      phones: ["+5582988444444"],
      cpf: "649.688.734-92",
      pid: generate(),
      averageEvaluation: 4.5,
    });

    const user = (await service.users.get({ _id: nonCached._id })) as User;

    expect(user.cpf).toBe(nonCached.cpf);

    const fromCache = (await cacheService.get("users", {
      _id: nonCached._id,
    })) as User;

    expect(user.cpf).toBe(fromCache.cpf);
  });

  it("get by a linking key", async () => {
    const user2 = (await service.users.get({
      phones: mockUser.phones[0],
    })) as User;

    expect(user2.firstName).toBe(mockUser.firstName);
    expect(user2.cpf).toBe(mockUser.cpf);
  });

  it("should update in both storages", async () => {
    const query = { _id: cached._id };

    await service.users.update(query, { firstName: "Second" });

    const persistent = (await UserModel.findOne(query)) as User;
    const fromCache = await cacheService.get("users", query);

    expect(persistent.firstName).toBe("Second");
    expect(fromCache.firstName).toBe("Second");
  });

  it("should do auto populate", async () => {
    const sessionPopulated = (await service.sessions.get({
      _id: session._id,
    })) as Session;

    expect(sessionPopulated.user._id.toString()).toBe(cached._id.toString());
  });

  it("should remove in both storages", async () => {
    const query = { _id: cached._id };

    await service.users.remove(query);

    const user = (await service.users.get(query)) as null;

    expect(user).toBe(null);
  });

  it("check empty value of linking key variable", () => {
    const array = ["foo"];
    const object = { foo: "bar" };
    const string = "foo";

    const emptyArray: any = [];
    const emptyObject: any = {};
    const emptyString: any = "";

    expect(service.users.isEmpty(array)).toBeFalsy();
    expect(service.users.isEmpty(object)).toBeFalsy();
    expect(service.users.isEmpty(string)).toBeFalsy();
    expect(service.users.isEmpty(emptyArray)).toBeTruthy();
    expect(service.users.isEmpty(emptyObject)).toBeTruthy();
    expect(service.users.isEmpty(emptyString)).toBeTruthy();
  });
});
