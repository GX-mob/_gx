/**
 * Data Service
 *
 * @group unit/services/data
 */
import { configureServiceTest } from "fastify-decorators/testing";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { UserModel } from "../../models/user";
import { DataService } from ".";
import IORedisMock from "ioredis-mock";
import { FastifyInstanceToken } from "fastify-decorators";

const mockUser = {
  firstName: "First",
  lastName: "Last",
  cpf: "123.456.789-09",
  phones: ["82988888888", "82988444445"],
  birth: new Date("06/13/1994"),
  groups: [1],
};

const mockSession = {
  groups: [1],
  userAgent: "test",
  ips: ["127.0.0.1"],
};

describe("Service: Data", () => {
  let handler: DataService;

  let cached;
  let session;
  let nonCached;
  let mongoServer;

  beforeAll(async () => {
    handler = configureServiceTest({
      service: DataService,
      mocks: [
        {
          provide: FastifyInstanceToken,
          useValue: {
            redis: new IORedisMock(),
          },
        },
      ],
    });

    mongoServer = new MongoMemoryServer();
    const URI = await mongoServer.getUri();

    mongoose.connect(URI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
    });

    nonCached = await UserModel.create({
      ...mockUser,
      phones: ["82988444444"],
      cpf: "649.688.734-92",
      credential: "asd",
    });
  });

  afterAll((done) => {
    mongoose.disconnect(async () => {
      await mongoServer.stop();
      done();
    });
  });

  it("should create", async () => {
    cached = await handler.users.create(mockUser);

    expect(cached._id instanceof mongoose.Types.ObjectId).toBeTruthy();

    const persistent = await handler.users.get({ _id: cached._id });
    const fromCache = await handler.cache.get("users", { _id: cached._id });

    expect(persistent.firstName).toBe(cached.firstName);
    expect(fromCache.firstName).toBe(cached.firstName);
    expect(fromCache).toMatchObject({
      ...mockUser,
      birth: mockUser.birth.toISOString(),
    });
  });

  it("should create and return populated", async () => {
    session = await handler.sessions.create(
      {
        ...mockSession,
        user: cached._id,
      },
      { cache: false }
    );

    expect(session.userAgent).toBe(mockSession.userAgent);
    expect(session.user._id.toString()).toBe(cached._id.toString());
  });

  it("should get cached record", async () => {
    const user = await handler.users.get({ _id: cached._id });

    expect(user.cpf).toBe(cached.cpf);
  });

  it("should get non-cached record", async () => {
    const user = await handler.users.get({ _id: nonCached._id });

    expect(user.cpf).toBe(nonCached.cpf);

    const fromCache = await handler.cache.get("users", { _id: nonCached._id });

    expect(user.firstName).toBe(fromCache.firstName);
  });

  it("get by a linking key", async () => {
    const user = await handler.users.get({ phones: mockUser.phones });
    const user2 = await handler.users.get({ phones: mockUser.phones[0] });

    expect(user.firstName).toBe(mockUser.firstName);
    expect(user.cpf).toBe(mockUser.cpf);

    expect(user2.firstName).toBe(mockUser.firstName);
    expect(user2.cpf).toBe(mockUser.cpf);
  });

  it("should update in both storages", async () => {
    const query = { _id: cached._id };

    await handler.users.update(query, { firstName: "Second" });

    const persistent = await UserModel.findOne(query);
    const fromCache = await handler.cache.get("users", query);

    expect(persistent.firstName).toBe("Second");
    expect(fromCache.firstName).toBe("Second");
  });

  it("should do auto populate", async () => {
    const sessionPopulated = await handler.sessions.get({ _id: session._id });

    expect(sessionPopulated.user._id.toString()).toBe(cached._id.toString());
  });

  it("should remove in both storages", async () => {
    const query = { _id: cached._id };

    await handler.users.remove(query);

    const user = await handler.users.get(query);

    expect(user).toBe(null);
  });

  it("check empty value of linking key variable", () => {
    const array = ["foo"];
    const object = { foo: "bar" };
    const string = "foo";

    const emptyArray = [];
    const emptyObject = {};
    const emptyString = "";

    expect(handler.users.isEmpty(array)).toBeFalsy();
    expect(handler.users.isEmpty(object)).toBeFalsy();
    expect(handler.users.isEmpty(string)).toBeFalsy();
    expect(handler.users.isEmpty(emptyArray)).toBeTruthy();
    expect(handler.users.isEmpty(emptyObject)).toBeTruthy();
    expect(handler.users.isEmpty(emptyString)).toBeTruthy();
  });
});
