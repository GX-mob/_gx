/**
 * @group unit/controller
 * @group unit/gateway/controller
 * @group unit/gateway/user/controller
 * @group unit/gateway/user/profile
 * @group unit/gateway/user/profile/controller
 */
import { createReadStream } from "fs";
import { Test } from "@nestjs/testing";
import faker from "faker";
import { LoggerModule, PinoLogger } from "nestjs-pino";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule, CacheService } from "@app/cache";
import { RepositoryModule } from "@app/repositories";
import { AuthModule } from "@app/auth";
import {
  StorageModule,
  StorageService,
  UploadStreamOptions,
} from "@app/storage";
import {
  ContactVerificationModule,
  TwilioService,
} from "@app/contact-verification";
import { UserModule } from "../user.module";
import { AccountService } from "../user.service";
import { mockUser, mockSession } from "@testing/testing";
import { resolve } from "path";
import { Readable } from "stream";
import { STORAGE_PREFIX_URLS, STORAGE_BUCKETS } from "../../constants";
import { UserProfileController } from "./profile.controller";
import { UserDto, UpdateProfileDto } from "../user.dto";
import {
  InternalServerErrorException,
  NotAcceptableException,
} from "@nestjs/common";
import { IUser } from "@shared/interfaces";

describe("User: ProfileController", () => {
  let usersService: AccountService;
  let storageService: StorageService;
  let pinoLogger: PinoLogger = {
    setContext: jest.fn(),
    error: jest.fn(),
  } as any;
  let controller: UserProfileController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        LoggerModule.forRoot({ pinoHttp: {} }),
        UserModule,
        AuthModule,
        CacheModule,
        RepositoryModule,
        ContactVerificationModule,
        StorageModule,
      ],
      controllers: [UserProfileController],
    })
      .overrideProvider(ConfigService)
      .useValue({ get() {} })
      .overrideProvider(CacheService)
      .useValue({})
      .overrideProvider(TwilioService)
      .useValue({})
      .overrideProvider(PinoLogger)
      .useValue(pinoLogger)
      .compile();

    usersService = moduleRef.get<AccountService>(AccountService);
    storageService = moduleRef.get<StorageService>(StorageService);
    controller = moduleRef.get<UserProfileController>(UserProfileController);
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

    const jpegPath = resolve(
      __dirname,
      "../../../../../libs/storage/src/mock",
      "mock.jpeg",
    );

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
      const readable = createReadStream(jpegPath);

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
      const readable = createReadStream(jpegPath);

      readable.destroy(error);
      request.isMultipart.mockReturnValue(true);
      jest
        .spyOn(storageService, "uploadStream")
        .mockImplementation(
          (bucket: string, readable: Readable, config: UploadStreamOptions) => {
            readable.on("error", config.streamErrorHandler);

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
      const readable = createReadStream(jpegPath);
      const readable2 = createReadStream(jpegPath);

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
      const readable = createReadStream(jpegPath);

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
