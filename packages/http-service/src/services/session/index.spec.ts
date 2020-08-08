/**
 * Session Service
 *
 * @group unit/services/session
 */
import { Types } from "mongoose";
import { configureServiceTest } from "fastify-decorators/testing";
import { Session } from "../../models/session";
import { SessionService } from ".";
import { DataService } from "../data";
import { CacheService } from "../cache";

const errorNotHavePrivateKey =
  "should throw error due to not have the privateKey";
let current: string;

(jasmine as any).getEnv().addReporter({
  specStarted: function (result: any) {
    current = result.description;
  },
});

describe("Service: Session", () => {
  const processDotEnv = { ...process.env };

  let service: SessionService;

  const userId = "foo";
  const sid = Types.ObjectId();
  const ua = "test";
  const ip = "127.0.0.1";

  const dataService = {
    users: {
      get: jest.fn().mockResolvedValue({ _id: userId, groups: [1] }),
    },
    sessions: {
      create: jest.fn().mockResolvedValue({
        _id: sid,
        userAgent: ua,
        ips: [ip],
      }),
      get: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    },
  };

  const cacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    if (current === errorNotHavePrivateKey) {
      const { AUTH_PRIVATE_KEY, ...newEnv } = process.env;

      process.env = newEnv;
    }

    service = configureServiceTest({
      service: SessionService,
      mocks: [
        { provide: DataService, useValue: dataService },
        {
          provide: CacheService,
          useValue: cacheService,
        },
      ],
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it("should create a session", async () => {
    const { token, session } = await service.create(userId, {
      ua,
      ip,
    });

    expect(typeof token).toBe("string");
    expect(session.userAgent === ua && session.ips[0] === ip).toBeTruthy();
  });

  it("should update a session", async () => {
    dataService.sessions.update.mockResolvedValue(void 0);
    dataService.sessions.get.mockResolvedValue({ active: false });

    await service.update(sid, { active: false });
    const updated = await service.get(sid);

    expect(updated.active).toBe(false);
  });

  it("should delete a session", async () => {
    dataService.sessions.remove.mockResolvedValue(void 0);
    dataService.sessions.get.mockResolvedValue(null);

    await service.delete(sid);
    const check = await service.get(sid);

    expect(check).toBe(null);
  });

  it(errorNotHavePrivateKey, async () => {
    await expect(
      service.create(userId, {
        ua,
        ip,
      })
    ).rejects.toThrow(
      "This service does not have the private key, isn't allowed to sign an authentication token"
    );

    process.env = processDotEnv;
  });

  it("should check permission", () => {
    const session1 = { groups: [1] };
    const session2 = { groups: [1, 2] };
    const group1 = [1];
    const group2 = [2];
    const group3 = [2, 3];
    const group4 = [4];

    expect(service.hasPermission(session1 as Session, group1)).toBeTruthy();
    expect(service.hasPermission(session1 as Session, group2)).toBeFalsy();
    expect(service.hasPermission(session1 as Session, group3)).toBeFalsy();
    expect(service.hasPermission(session1 as Session, group4)).toBeFalsy();
    expect(service.hasPermission(session2 as Session, group1)).toBeTruthy();
    expect(service.hasPermission(session2 as Session, group2)).toBeTruthy();
    expect(service.hasPermission(session2 as Session, group3)).toBeTruthy();
    expect(service.hasPermission(session2 as Session, group4)).toBeFalsy();
  });

  it("should verify a token", async () => {
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue("OK");

    const { token } = await service.create(userId, {
      ua,
      ip,
    });

    const groups = [1];

    dataService.sessions.get.mockResolvedValue({
      _id: sid,
      uid: userId,
      groups,
      userAgent: ua,
      ips: [ip],
      active: true,
    });

    const { session: sessionData } = await service.verify(token, ip);

    expect(sessionData._id instanceof Types.ObjectId).toBeTruthy();
    //expect(sessionData.user._id.toString()).toBe(userId.toString());
    expect(Array.isArray(sessionData.groups)).toBeTruthy();
    expect(sessionData.userAgent).toBe(ua);
    expect(sessionData.ips[0]).toBe(ip);
    expect(sessionData.active).toBeTruthy();

    cacheService.get.mockResolvedValue(sessionData);

    const { session: fromCache } = await service.verify(token, ip);

    expect(fromCache._id instanceof Types.ObjectId).toBeTruthy();
    //expect(fromCache.user._id.toString()).toBe(userId.toString());
    expect(Array.isArray(fromCache.groups)).toBeTruthy();
    expect(fromCache.userAgent).toBe(ua);
    expect(fromCache.ips[0]).toBe(ip);
    expect(fromCache.active).toBeTruthy();
  });

  it("should throw an error due to deactivated or non existent session", async () => {
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue("OK");

    const { token } = await service.create(userId, {
      ua,
      ip,
    });

    dataService.sessions.get.mockResolvedValue(null);

    const { error: err1 } = await service.verify(token, ip);

    expect(err1).toBe("not-found");

    dataService.sessions.get.mockResolvedValue({ active: false });

    const { error: err2 } = await service.verify(token, ip);

    expect(err2).toBe("deactivated");
  });

  it("should not create a session due to not found the user", async () => {
    dataService.users.get.mockResolvedValue(null);

    await expect(
      service.create(userId, {
        ua,
        ip,
      })
    ).rejects.toThrow("User not found");
  });

  it("should append ip to ip tracking field", async () => {
    const session = {
      _id: sid,
      uid: userId,
      userAgent: ua,
      groups: [1],
      ips: [ip],
      active: true,
    };
    dataService.users.get.mockResolvedValue({ _id: userId, groups: [1] });
    dataService.sessions.get.mockResolvedValue(session);
    dataService.sessions.update.mockResolvedValue("OK");

    const { token } = await service.create(userId, {
      ua,
      ip,
    });

    const newIp = "127.0.0.2";

    const {
      session: { ips },
    } = await service.verify(token, newIp);

    expect(ips.includes(newIp)).toBeTruthy();
  });
});
