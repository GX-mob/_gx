/**
 * Sign-in Controller
 *
 * @group unit/controllers/profile
 */
import { Types } from "mongoose";
import {
  NotAcceptableException,
  InternalServerErrorException,
} from "@nestjs/common";
import { User, USERS_ROLES } from "@app/database";
import { AccountProfileController } from "./profile.controller";
import { UpdateProfileDto } from "./dto";
import { UserEntity } from "./entities/user.entity";
import shortid from "shortid";
import faker from "faker";
import { Logger } from "pino";
import { readFileSync } from "fs";
import { resolve } from "path";
//@ts-ignore
import { ReadableStreamBuffer, WritableStreamBuffer } from "stream-buffers";
import { Readable } from "stream";
import { STORAGE_PREFIX_URLS, STORAGE_BUCKETS } from "../constants";

describe("AccountProfileController", () => {
  let profileController: AccountProfileController;

  const dataServiceMock = {
    users: {
      get: jest.fn(),
      update: jest.fn(),
    },
    sessions: {
      updateCache: jest.fn(),
    },
  };

  const storageServiceMock = {
    uploadStream: jest.fn(),
    delete: jest.fn(),
  };

  const loggerMock = {
    error: jest.fn(),
  };

  let fastifyRequestMock: any = {
    headers: {
      "user-agent": "foo",
    },
    raw: { headers: { "x-client-ip": "127.0.0.1" } },
    session: { user: {} },
  };

  const fastifyResponseMock = {
    code: jest.fn(),
    send: jest.fn(),
  };

  function mockUser(): User {
    return {
      _id: new Types.ObjectId(),
      pid: shortid.generate(),
      firstName: "First",
      lastName: "Last",
      cpf: "123.456.789-09",
      phones: ["82988888888"],
      emails: ["valid@email.com"],
      birth: new Date("06/13/1994"),
      password: Buffer.from("test"),
      averageEvaluation: 5.0,
      roles: [USERS_ROLES.VOYAGER],
    };
  }

  const jpegBuffer = readFileSync(
    resolve(__dirname, "../../../../libs/storage/src/mock", "mock.jpeg"),
  );
  const pngBuffer = readFileSync(
    resolve(__dirname, "../../../../libs/storage/src/mock", "mock.png"),
  );

  function createReadableFrom(buffer: Buffer) {
    const readable = new ReadableStreamBuffer();
    readable.put(buffer);
    readable.stop();
    return readable;
  }

  beforeEach(() => {
    profileController = new AccountProfileController(
      dataServiceMock as any,
      storageServiceMock as any,
    );

    profileController.logger = (loggerMock as unknown) as Logger;
  });

  afterEach(() => {
    jest.resetAllMocks();
    fastifyRequestMock = {
      headers: {
        "user-agent": "foo",
      },
      raw: { headers: { "x-client-ip": "127.0.0.1" } },
      session: { user: {} },
    };
  });

  describe("getHandler", () => {
    it("should result user data", async () => {
      const user = mockUser();

      fastifyRequestMock.session.user = user;

      const userEntity = new UserEntity(user);

      expect(profileController.getHandler(fastifyRequestMock)).toStrictEqual(
        userEntity,
      );
    });
  });

  describe("updateHandler", () => {
    it("should update", async () => {
      const user = mockUser();

      fastifyRequestMock.session = { _id: new Types.ObjectId(), user };

      const requestBody = new UpdateProfileDto();
      requestBody.firstName = faker.name.firstName();
      requestBody.lastName = faker.name.lastName();

      await profileController.updateHandler(fastifyRequestMock, requestBody);

      const dataCalls = dataServiceMock.users.update.mock.calls;

      expect(dataCalls[0][0]).toStrictEqual({
        _id: user._id,
      });
      expect(dataCalls[0][1]).toStrictEqual(requestBody);
      expect(
        dataServiceMock.sessions.updateCache.mock.calls[0][0],
      ).toStrictEqual({
        _id: fastifyRequestMock.session._id,
      });
    });
  });

  describe("uploadAvatar", () => {
    it("should thow NotAcceptableException due to non-multipart content-type", async () => {
      fastifyRequestMock.isMultipart = () => false;

      await expect(
        profileController.uploadAvatar(
          fastifyRequestMock,
          fastifyResponseMock as any,
        ),
      ).rejects.toStrictEqual(new NotAcceptableException());
    });

    it("should catch storage service upload error", async (done) => {
      const error = new Error("internal");
      const readable = createReadableFrom(pngBuffer);

      fastifyRequestMock.isMultipart = () => true;
      storageServiceMock.uploadStream.mockRejectedValue(error);
      fastifyRequestMock.multipart = async (handler: any, finish: any) => {
        await handler("photo", readable, "myphoto.png");
        finish();

        expect(loggerMock.error.mock.calls[0][0]).toStrictEqual(error);
        expect(fastifyResponseMock.send.mock.calls[0][0]).toStrictEqual(
          new InternalServerErrorException(),
        );
        done();
      };

      await profileController.uploadAvatar(
        fastifyRequestMock,
        fastifyResponseMock as any,
      );
    });

    it("should catch stream error", async (done) => {
      const user = mockUser();
      const error = new Error("stream");
      const readable = createReadableFrom(pngBuffer);

      readable.destroy(error);

      fastifyRequestMock.isMultipart = () => true;
      fastifyRequestMock.session.user = user;

      (storageServiceMock as any).uploadStream = (
        bucket: string,
        readable: Readable,
        config: any,
      ) => {
        readable.on("error", config.errorHandler);

        return Promise.resolve();
      };

      fastifyRequestMock.multipart = async (handler: any, finish: any) => {
        await handler("photo", readable, "myphoto.png");
        finish();

        await new Promise((resolve) => setTimeout(resolve, 10));

        // catch internal stream errors
        expect(loggerMock.error.mock.calls[0][0]).toStrictEqual(error);
        expect(typeof fastifyResponseMock.send.mock.calls[0][0].url).toBe(
          "string",
        );
        storageServiceMock.uploadStream = jest.fn();
        done();
      };

      await profileController.uploadAvatar(
        fastifyRequestMock,
        fastifyResponseMock as any,
      );
    });

    it("should handle a unique file", async (done) => {
      const user = mockUser();
      const error = new Error("stream");
      const readable = createReadableFrom(jpegBuffer);
      const readable2 = createReadableFrom(pngBuffer);

      fastifyRequestMock.isMultipart = () => true;
      fastifyRequestMock.session.user = user;

      fastifyRequestMock.multipart = async (handler: any, finish: any) => {
        await handler("photo", readable, "myphoto.jpeg");
        handler("photo2", readable2, "myphoto.png");
        finish();

        await new Promise((resolve) => setTimeout(resolve, 10));

        // catch internal stream errors
        expect(storageServiceMock.uploadStream).toHaveBeenCalledTimes(1);
        done();
      };

      await profileController.uploadAvatar(
        fastifyRequestMock,
        fastifyResponseMock as any,
      );
    });

    it("should delete current avatar", async (done) => {
      const user = mockUser();
      const currentAvatar = `http://${STORAGE_PREFIX_URLS.USERS_AVATARTS}/${STORAGE_BUCKETS.USERS_AVATARTS}/current.jpeg`;
      const readable = createReadableFrom(jpegBuffer);

      storageServiceMock.delete.mockResolvedValue({});

      fastifyRequestMock.isMultipart = () => true;
      fastifyRequestMock.session.user = { ...user, avatar: currentAvatar };

      fastifyRequestMock.multipart = async (handler: any, finish: any) => {
        await handler("photo", readable, "myphoto.png");
        finish();

        const deleteCalls = storageServiceMock.delete.mock.calls;
        const sendCalls = fastifyResponseMock.send.mock.calls;

        expect(deleteCalls[0][0]).toBe(STORAGE_BUCKETS.USERS_AVATARTS);
        expect(deleteCalls[0][1]).toBe(currentAvatar);

        expect(typeof sendCalls[0][0].url).toBe("string");
        done();
      };

      await profileController.uploadAvatar(
        fastifyRequestMock,
        fastifyResponseMock as any,
      );
    });
  });
});
