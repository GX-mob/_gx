/**
 * Data Service
 *
 * @group unit/services/session
 */
import { Types } from "mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { UserModel } from "@app/database";
import { DataModule, DataService } from "@app/data";
import { DatabaseService, Session } from "@app/database";
import { CacheModule, CacheService } from "@app/cache";
import { SessionService } from "./session.service";

describe("SessionService", () => {
  let service: SessionService;

  const mockUser = {
    firstName: "First",
    lastName: "Last",
    cpf: "123.456.789-09",
    phones: ["82988888888"],
    emails: ["valid@email.com"],
    birth: new Date("06/13/1994"),
  };

  let user = new UserModel(mockUser);
  const sid = Types.ObjectId();
  const ua = "test";
  const ip = "127.0.0.1";

  const dataService = {
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

  const cacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ".development.env" }),
        DataModule,
        CacheModule,
      ],
      providers: [SessionService],
    })
      .overrideProvider(DataService)
      .useValue(dataService)
      .overrideProvider(CacheService)
      .useValue(cacheService)
      .overrideProvider(DatabaseService)
      .useValue({})
      .compile();

    service = module.get<SessionService>(SessionService);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

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

  it("should check permission", () => {
    const session1 = ({ user: { roles: ["voyager"] } } as unknown) as Session;
    const session2 = ({
      user: { roles: ["voyager", "driver"] },
    } as unknown) as Session;
    const group1 = ["voyager"];
    const group2 = ["driver"];
    const group3 = ["driver", "admin"];
    const group4 = ["su"];

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
    expect(session.userAgent).toBe(ua);
    expect(session.ips[0]).toBe(ip);
    expect(session.active).toBeTruthy();

    cacheService.get.mockResolvedValue(session);

    const fromCache = await service.verify(token, ip);

    expect(fromCache._id instanceof Types.ObjectId).toBeTruthy();
    expect(fromCache.userAgent).toBe(ua);
    expect(fromCache.ips[0]).toBe(ip);
    expect(fromCache.active).toBeTruthy();
  });

  it("should throw an error due to deactivated or non existent session", async () => {
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue("OK");
    dataService.sessions.verifyToken.mockResolvedValue(true);
    dataService.sessions.get.mockResolvedValue(null);

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

    const newIp = "127.0.0.2";
    const { token } = await service.create(user, ua, ip);
    const { ips } = await service.verify(token, newIp);

    expect(ips.includes(newIp)).toBeTruthy();
  });
});
