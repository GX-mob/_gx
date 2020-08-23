/**
 * Data Service
 *
 * @group unit/services/data
 */
import { configureServiceTest } from "fastify-decorators/testing";
import mongoose from "mongoose";
import { connect, disconnect } from "../../database";
import { MongoMemoryServer } from "mongodb-memory-server";

import { UserModel, User } from "../../database/models/user";
import { DataService } from ".";
import { FastifyInstanceToken } from "fastify-decorators";
import { generate } from "shortid";
import { Session } from "../../database/models/session";

const IORedisMock = require("ioredis-mock");

const mockUser = {
  firstName: "First",
  lastName: "Last",
  cpf: "123.456.789-09",
  phones: ["+5582988888888", "+5582988444445"],
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

  let cached: any;
  let session: any;
  let nonCached: any;
  let mongoServer: any;

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

    await connect(URI);

    nonCached = await UserModel.create({
      ...mockUser,
      phones: ["+5582988444444"],
      cpf: "649.688.734-92",
      pid: generate(),
      averageEvaluation: 4.5,
    });
  });

  afterAll(async () => {
    await disconnect();
    await mongoServer.stop();
  });

  it("should create", async () => {
    cached = await handler.users.create(mockUser);

    expect(cached._id instanceof mongoose.Types.ObjectId).toBeTruthy();

    const persistent = (await handler.users.get({ _id: cached._id })) as User;
    const fromCache = (await handler.cache.get("users", {
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
    const user = (await handler.users.get({ _id: cached._id })) as User;

    expect(user.cpf).toBe(cached.cpf);
  });

  it("should get non-cached record", async () => {
    const user = (await handler.users.get({ _id: nonCached._id })) as User;

    expect(user.cpf).toBe(nonCached.cpf);

    const fromCache = (await handler.cache.get("users", {
      _id: nonCached._id,
    })) as User;

    expect(user.firstName).toBe(fromCache.firstName);
  });

  it("get by a linking key", async () => {
    //const user = await handler.users.get({ phones: mockUser.phones });
    const user2 = (await handler.users.get({
      phones: mockUser.phones[0],
    })) as User;

    //expect(user.firstName).toBe(mockUser.firstName);
    //expect(user.cpf).toBe(mockUser.cpf);

    expect(user2.firstName).toBe(mockUser.firstName);
    expect(user2.cpf).toBe(mockUser.cpf);
  });

  it("should update in both storages", async () => {
    const query = { _id: cached._id };

    await handler.users.update(query, { firstName: "Second" });

    const persistent = (await UserModel.findOne(query)) as User;
    const fromCache = await handler.cache.get("users", query);

    expect(persistent.firstName).toBe("Second");
    expect(fromCache.firstName).toBe("Second");
  });

  it("should do auto populate", async () => {
    const sessionPopulated = (await handler.sessions.get({
      _id: session._id,
    })) as Session;

    expect(sessionPopulated.user._id.toString()).toBe(cached._id.toString());
  });

  it("should remove in both storages", async () => {
    const query = { _id: cached._id };

    await handler.users.remove(query);

    const user = (await handler.users.get(query)) as null;

    expect(user).toBe(null);
  });

  it("check empty value of linking key variable", () => {
    const array = ["foo"];
    const object = { foo: "bar" };
    const string = "foo";

    const emptyArray: any = [];
    const emptyObject: any = {};
    const emptyString: any = "";

    expect(handler.users.isEmpty(array)).toBeFalsy();
    expect(handler.users.isEmpty(object)).toBeFalsy();
    expect(handler.users.isEmpty(string)).toBeFalsy();
    expect(handler.users.isEmpty(emptyArray)).toBeTruthy();
    expect(handler.users.isEmpty(emptyObject)).toBeTruthy();
    expect(handler.users.isEmpty(emptyString)).toBeTruthy();
  });
});
