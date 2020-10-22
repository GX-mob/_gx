/**
 * @group unit/controller
 * @group unit/gateway/controller
 * @group unit/gateway/user/controller
 * @group unit/gateway/user/profile
 * @group unit/gateway/user/profile/controller
 */
import { Test } from "@nestjs/testing";
import faker from "faker";
import { LoggerModule, PinoLogger } from "nestjs-pino";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule, CacheService } from "@app/cache";
import { RepositoryModule, RepositoryService } from "@app/repositories";
import { SessionModule } from "@app/session";
import { StorageModule, StorageService } from "@app/storage";
import {
  ContactVerificationModule,
  TwilioService,
} from "@app/contact-verification";
import { UsersModule } from "../users.module";
import { UsersService } from "../users.service";
import { mockUser, mockSession } from "@testing/testing";
import { readFileSync } from "fs";
import { resolve } from "path";
//@ts-ignore
import { ReadableStreamBuffer } from "stream-buffers";
import { Readable } from "stream";
import { STORAGE_PREFIX_URLS, STORAGE_BUCKETS } from "../../constants";
import { ProfileController } from "./profile.controller";
import { UpdateProfileDto, UserDto } from "./management.dto";
import {
  InternalServerErrorException,
  NotAcceptableException,
} from "@nestjs/common";
import { IUser } from "@shared/interfaces";

describe("User: ProfileController", () => {
  let usersService: UsersService;
  let storageService: StorageService;
  let pinoLogger: PinoLogger = {
    setContext: jest.fn(),
    error: jest.fn(),
  } as any;
  let controller: ProfileController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        LoggerModule.forRoot({ pinoHttp: {} }),
        UsersModule,
        SessionModule,
        CacheModule,
        RepositoryModule,
        ContactVerificationModule,
        StorageModule,
      ],
      controllers: [ProfileController],
    })
      .overrideProvider(ConfigService)
      .useValue({ get() {} })
      .overrideProvider(CacheService)
      .useValue({})
      .overrideProvider(RepositoryService)
      .useValue({})
      .overrideProvider(TwilioService)
      .useValue({})
      .overrideProvider(PinoLogger)
      .useValue(pinoLogger)
      .compile();

    usersService = moduleRef.get<UsersService>(UsersService);
    storageService = moduleRef.get<StorageService>(StorageService);
    controller = moduleRef.get<ProfileController>(ProfileController);
  });

  it("getProfileHandler", async () => {
    const user = mockUser();
    const userDto = new UserDto(user);
    const response = controller.getProfileHandler(user);

    expect(response).toStrictEqual(userDto);
  });

  it("updateHandler", async () => {
    const session = mockSession();
    const newFirstName = faker.name.firstName();
    const updateProfileDto = new UpdateProfileDto();
    updateProfileDto.firstName = newFirstName;

    const updateById = jest
      .spyOn(usersService, "updateById")
      .mockResolvedValue();

    await controller.updateHandler(session, updateProfileDto);

    expect(updateById).toBeCalledWith(session.user._id, {
      firstName: newFirstName,
    });
  });

  describe("uploadAvatar", () => {
    let user: IUser;
    let request = {
      isMultipart: jest.fn(),
      multipart: jest.fn(),
    };

    const jpegBuffer = readFileSync(
      resolve(__dirname, "../../../../../libs/storage/src/mock", "mock.jpeg"),
    );
    const pngBuffer = readFileSync(
      resolve(__dirname, "../../../../../libs/storage/src/mock", "mock.png"),
    );

    function createReadableFrom(buffer: Buffer) {
      const readable = new ReadableStreamBuffer();
      readable.put(buffer);
      readable.stop();
      return readable;
    }

    beforeEach(() => {
      user = mockUser();
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it("should throw NotAcceptableException", async () => {
      request.isMultipart.mockReturnValue(false);
      await expect(
        controller.uploadAvatar({} as any, request as any),
      ).rejects.toStrictEqual(new NotAcceptableException());
    });

    it("should catch storage service upload error", async (done) => {
      const error = new Error("internal");
      const readable = createReadableFrom(pngBuffer);

      request.isMultipart.mockReturnValue(true);
      jest.spyOn(storageService, "uploadStream").mockRejectedValue(error);
      request.multipart.mockImplementation(
        async (handler: any, finish: any) => {
          await handler("photo", readable, "myphoto.png");
          finish();

          expect(pinoLogger.error).toBeCalledWith(error);

          done();
        },
      );

      await expect(
        controller.uploadAvatar(user, request as any),
      ).rejects.toStrictEqual(new InternalServerErrorException());
    });

    it("should catch stream error", async (done) => {
      const error = new Error("internal");
      const readable = createReadableFrom(pngBuffer);

      readable.destroy(error);
      request.isMultipart.mockReturnValue(true);
      jest
        .spyOn(storageService, "uploadStream")
        .mockImplementation(
          (bucket: string, readable: Readable, config: any) => {
            readable.on("error", config.errorHandler);

            return Promise.resolve() as any;
          },
        );
      request.multipart.mockImplementation(
        async (handler: any, finish: any) => {
          await handler("photo", readable, "myphoto.png");
          finish();

          await new Promise((resolve) => setTimeout(resolve, 100));

          // catch internal stream errors
          expect(pinoLogger.error).toBeCalledWith(error);
          done();
        },
      );

      await expect(
        controller.uploadAvatar(user, request as any),
      ).resolves.toBeTruthy();
    });

    it("should handle a unique file", async (done) => {
      const readable = createReadableFrom(pngBuffer);
      const readable2 = createReadableFrom(jpegBuffer);

      request.isMultipart.mockReturnValue(true);
      const uploatStream = jest
        .spyOn(storageService, "uploadStream")
        .mockImplementation(() => {
          return Promise.resolve() as any;
        });

      request.multipart.mockImplementation(
        async (handler: any, finish: any) => {
          await handler("photo", readable, "myphoto.jpeg");
          await handler("photo2", readable2, "myphoto.png");
          finish();

          await new Promise((resolve) => setTimeout(resolve, 10));

          expect(uploatStream).toHaveBeenCalledTimes(1);
          done();
        },
      );

      await controller.uploadAvatar(user, request as any);
    });

    it("should delete current avatar", async (done) => {
      const avatar = `http://${STORAGE_PREFIX_URLS.USERS_AVATARTS}/${STORAGE_BUCKETS.USERS_AVATARTS}/current.jpeg`;
      const user = mockUser({ avatar });
      const readable = createReadableFrom(pngBuffer);

      request.isMultipart.mockReturnValue(true);
      const uploatStream = jest
        .spyOn(storageService, "uploadStream")
        .mockImplementation(() => {
          return Promise.resolve() as any;
        });
      const storageDelete = jest
        .spyOn(storageService, "delete")
        .mockResolvedValue({} as any);

      request.multipart.mockImplementation(
        async (handler: any, finish: any) => {
          await handler("photo", readable, "myphoto.jpeg");
          finish();

          await new Promise((resolve) => setTimeout(resolve, 10));

          expect(storageDelete).toBeCalledWith(
            STORAGE_BUCKETS.USERS_AVATARTS,
            avatar,
          );
          expect(uploatStream).toHaveBeenCalledTimes(1);
          done();
        },
      );

      await controller.uploadAvatar(user, request as any);
    });
  });
});
