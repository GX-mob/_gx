/**
 * Session Service
 *
 * @group unit/services/session
 */
import { Types } from "mongoose";
import { configureServiceTest } from "fastify-decorators/testing";
import { User, UserModel } from "../../models/user";
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

const mockUser = {
  firstName: "First",
  lastName: "Last",
  cpf: "123.456.789-09",
  phones: ["82988888888"],
  emails: ["valid@email.com"],
  birth: new Date("06/13/1994"),
};

describe("Service: Session", () => {
  const processDotEnv = { ...process.env };

  let service: SessionService;

  let user: User;
  const sid = Types.ObjectId();
  const ua = "test";
  const ip = "127.0.0.1";

  let dataService: any = {};

  const cacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeAll(async () => {
    user = new UserModel(mockUser);
    dataService = {
      users: {
        get: jest.fn().mockResolvedValue({ _id: user._id, groups: [1] }),
      },
      sessions: {
        create: jest.fn().mockResolvedValue({
          _id: sid,
          userAgent: ua,
          ips: [ip],
        }),
        verifyToken: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
      },
    };
  });

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
    const { token, session } = await service.create(user, ua, ip);

    expect(typeof token).toBe("string");
    expect(session.userAgent === ua && session.ips[0] === ip).toBeTruthy();
  });

  it("should update a session", async () => {
    dataService.sessions.update.mockResolvedValue(void 0);
    dataService.sessions.get.mockResolvedValue({ active: false });

    await service.update(sid, { active: false });
    const updated = await service.get(sid);

    expect((updated as Session).active).toBe(false);
  });

  it("should delete a session", async () => {
    dataService.sessions.remove.mockResolvedValue(void 0);
    dataService.sessions.get.mockResolvedValue(null);

    await service.delete(sid);
    const check = await service.get(sid);

    expect(check).toBe(null);
  });

  it(errorNotHavePrivateKey, async () => {
    await expect(service.create(user, ua, ip)).rejects.toThrow(
      "This service does not have the private key, isn't allowed to sign an authentication token"
    );

    process.env = processDotEnv;
  });

  it("should check permission", () => {
    const session1 = ({ user: { groups: [1] } } as unknown) as Session;
    const session2 = ({ user: { groups: [1, 2] } } as unknown) as Session;
    const group1 = [1];
    const group2 = [2];
    const group3 = [2, 3];
    const group4 = [4];

    expect(service.hasPermission(session1, group1)).toBeTruthy();
    expect(service.hasPermission(session1, group2)).toBeFalsy();
    expect(service.hasPermission(session1, group3)).toBeFalsy();
    expect(service.hasPermission(session1, group4)).toBeFalsy();
    expect(service.hasPermission(session2, group1)).toBeTruthy();
    expect(service.hasPermission(session2, group2)).toBeTruthy();
    expect(service.hasPermission(session2, group3)).toBeTruthy();
    expect(service.hasPermission(session2, group4)).toBeFalsy();
  });

  it("should verify a token", async () => {
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue("OK");

    const { token } = await service.create(user, ua, ip);

    const groups = [1];

    dataService.sessions.get.mockResolvedValue({
      _id: sid,
      uid: user._id,
      groups,
      userAgent: ua,
      ips: [ip],
      active: true,
    });

    const session = await service.verify(token, ip);

    expect(session._id instanceof Types.ObjectId).toBeTruthy();
    //expect(sessionData.user._id.toString()).toBe(userId.toString());
    expect(session.userAgent).toBe(ua);
    expect(session.ips[0]).toBe(ip);
    expect(session.active).toBeTruthy();

    cacheService.get.mockResolvedValue(session);

    const fromCache = await service.verify(token, ip);

    expect(fromCache._id instanceof Types.ObjectId).toBeTruthy();
    //expect(fromCache.user._id.toString()).toBe(userId.toString());
    expect(fromCache.userAgent).toBe(ua);
    expect(fromCache.ips[0]).toBe(ip);
    expect(fromCache.active).toBeTruthy();
  });

  it("should throw an error due to deactivated or non existent session", async () => {
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue("OK");
    dataService.sessions.verifyToken.mockResolvedValue(true);
    dataService.sessions.get.mockResolvedValue(null);
    // dataService.sessions.checkState.mockResolvedValue(true);

    const { token } = await service.create(user, ua, ip);

    await expect(service.verify(token, ip)).rejects.toThrow("not-found");

    dataService.sessions.get.mockResolvedValue({ active: false });

    await expect(service.verify(token, ip)).rejects.toThrow("deactivated");
  });

  it("should append ip to ip tracking field", async () => {
    const session = {
      _id: sid,
      uid: user._id,
      userAgent: ua,
      groups: [1],
      ips: [ip],
      active: true,
    };
    dataService.users.get.mockResolvedValue({ _id: user._id, groups: [1] });
    dataService.sessions.get.mockResolvedValue(session);
    dataService.sessions.update.mockResolvedValue("OK");

    const { token } = await service.create(user, ua, ip);

    const newIp = "127.0.0.2";

    const { ips } = await service.verify(token, newIp);

    expect(ips.includes(newIp)).toBeTruthy();
  });
});
