/**
 * @group integration/repositories/repository-factory
 */
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { IUser, ISession } from "@shared/interfaces";
import {
  RepositoryModule,
  UserModel,
  UserRepository,
  SessionRepository,
} from "@app/repositories";
import { CacheModule, CacheService } from "@app/cache";
import mongoose from "mongoose";
import { mockUser, mockSession } from "@testing/testing";

describe("RepositoryFactory", () => {
  let module: TestingModule;
  let userRepository: UserRepository;
  let sessionRepository: SessionRepository;
  let cacheService: CacheService;

  let userCached: any;
  let session: any;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ".development.env",
        }),
        LoggerModule.forRoot(),
        RepositoryModule,
        CacheModule,
      ],
      providers: [ConfigService, UserRepository, SessionRepository],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
    sessionRepository = module.get<SessionRepository>(SessionRepository);
    cacheService = module.get<CacheService>(CacheService);

    await module.init();
  });

  afterAll(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(userRepository).toBeDefined();
    expect(sessionRepository).toBeDefined();
  });

  it("should create", async () => {
    const { _id, ...user } = mockUser();
    userCached = await userRepository.create(user);

    expect(userCached._id instanceof mongoose.Types.ObjectId).toBeTruthy();

    const [persistent] = ((await userRepository.model.find({
      _id: userCached._id,
    })) as unknown) as IUser[];
    const fromCache = (await cacheService.get(UserRepository.name, {
      _id: userCached._id,
    })) as IUser;

    expect(persistent.firstName).toBe(userCached.firstName);
    expect(fromCache.firstName).toBe(userCached.firstName);
    expect(fromCache).toMatchObject({
      ...mockUser,
      birth: user.birth.toISOString(),
    });
  });

  it("should create and return populated", async () => {
    const { _id, ...sessionMock } = mockSession({ user: userCached._id });
    session = await sessionRepository.create(
      {
        ...sessionMock,
      },
      { cache: false },
    );

    expect(session.userAgent).toBe(sessionMock.userAgent);
    expect(session.user._id.toString()).toBe(userCached._id.toString());
  });

  it("should get record from cache", async () => {
    const user = (await userRepository.get({
      _id: userCached._id,
    })) as IUser;

    expect(user.cpf).toBe(userCached.cpf);
  });

  it("should get non-cached record", async () => {
    const nonCached = await UserModel.create(mockUser());

    const user = (await userRepository.get({
      _id: nonCached._id,
    })) as IUser;

    expect(user.cpf).toBe(nonCached.cpf);

    const fromCache = (await cacheService.get(UserRepository.name, {
      _id: nonCached._id,
    })) as IUser;

    expect(user.cpf).toBe(fromCache.cpf);
  });

  it("get by a linking key", async () => {
    const user2 = (await userRepository.get({
      phones: userCached.phones[0],
    })) as IUser;

    expect(user2.firstName).toBe(userCached.firstName);
    expect(user2.cpf).toBe(userCached.cpf);
  });

  it("should update in both storages", async () => {
    const query = { _id: userCached._id };

    await userRepository.update(query, { firstName: "Second" });

    const persistent = (await UserModel.findOne(query)) as IUser;
    const fromCache = await cacheService.get(UserRepository.name, query);

    expect(persistent.firstName).toBe("Second");
    expect(fromCache.firstName).toBe("Second");
  });

  it("should do auto populate", async () => {
    const sessionPopulated = (await sessionRepository.get({
      _id: session._id,
    })) as ISession;

    expect(sessionPopulated.user._id.toString()).toBe(
      userCached._id.toString(),
    );
  });

  it("should remove in both storages", async () => {
    const query = { _id: userCached._id };

    await userRepository.remove(query);

    const user = (await userRepository.get(query)) as null;

    expect(user).toBe(null);
  });

  it("check empty value of linking key variable", () => {
    const array = ["foo"];
    const object = { foo: "bar" };
    const string = "foo";

    const emptyArray: any = [];
    const emptyObject: any = {};
    const emptyString: any = "";

    expect(userRepository.isEmpty(array)).toBeFalsy();
    expect(userRepository.isEmpty(object)).toBeFalsy();
    expect(userRepository.isEmpty(string)).toBeFalsy();
    expect(userRepository.isEmpty(emptyArray)).toBeTruthy();
    expect(userRepository.isEmpty(emptyObject)).toBeTruthy();
    expect(userRepository.isEmpty(emptyString)).toBeTruthy();
  });
});
