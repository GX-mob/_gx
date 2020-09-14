/**
 * Sign-in Controller
 *
 * @group unit/controllers/security
 */
import { Types } from "mongoose";
import { UnprocessableEntityException } from "@nestjs/common";
import { User, USERS_ROLES } from "@app/repositories";
import { util } from "@app/helpers";
import { AccountSecurityController } from "./security.controller";
import { UpdatePasswordDto, Enable2FADto, Disable2FADto } from "./dto";
import shortid from "shortid";
import faker from "faker";
import { EXCEPTIONS_MESSAGES } from "../constants";

describe("AccountProfileController", () => {
  let securityController: AccountSecurityController;

  const userRepositoryMock = {
    get: jest.fn(),
    update: jest.fn(),
    model: {
      updateOne: jest.fn(),
    },
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
      phones: ["+5582988888888"],
      emails: ["valid@email.com"],
      birth: new Date("06/13/1994"),
      averageEvaluation: 5.0,
      roles: [USERS_ROLES.VOYAGER],
    };
  }
  beforeEach(() => {
    securityController = new AccountSecurityController(
      userRepositoryMock as any,
    );
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

  describe("updatePassword", () => {
    it("should create a password", async () => {
      const user = mockUser();
      const newPassword = faker.internet.password();

      fastifyRequestMock.session.user = user;
      const requestBody = new UpdatePasswordDto();

      requestBody.current = "";
      requestBody.new = newPassword;

      await securityController.updatePassword(fastifyRequestMock, requestBody);

      const mockCalls = userRepositoryMock.model.updateOne.mock.calls;

      const newPasswordHash = mockCalls[0][1].password;

      expect(mockCalls[0][0]).toStrictEqual({ _id: user._id });
      expect(newPasswordHash instanceof Buffer).toBeTruthy();
      expect(util.assertPassword(newPassword, newPasswordHash)).toBeTruthy();
    });

    it(`should throw UnprocessableEntityException("${EXCEPTIONS_MESSAGES.WRONG_PASSWORD}")`, async () => {
      const user = mockUser();
      const currentPassword = faker.internet.password();
      const newPassword = faker.internet.password();
      user.password = await util.hashPassword(currentPassword);

      fastifyRequestMock.session.user = user;
      const requestBody = new UpdatePasswordDto();

      requestBody.current = "wrong";
      requestBody.new = newPassword;

      await expect(
        securityController.updatePassword(fastifyRequestMock, requestBody),
      ).rejects.toStrictEqual(
        new UnprocessableEntityException(EXCEPTIONS_MESSAGES.WRONG_PASSWORD),
      );
    });

    it(`should throw UnprocessableEntityException("${EXCEPTIONS_MESSAGES.UNCHANGED_DATA}")`, async () => {
      const user = mockUser();
      const currentPassword = faker.internet.password();
      const newPassword = currentPassword;
      user.password = await util.hashPassword(currentPassword);

      fastifyRequestMock.session.user = user;
      const requestBody = new UpdatePasswordDto();

      requestBody.current = currentPassword;
      requestBody.new = newPassword;

      await expect(
        securityController.updatePassword(fastifyRequestMock, requestBody),
      ).rejects.toStrictEqual(
        new UnprocessableEntityException(EXCEPTIONS_MESSAGES.UNCHANGED_DATA),
      );
    });

    it("should update password", async () => {
      const user = mockUser();
      const currentPassword = faker.internet.password();
      const newPassword = faker.internet.password();
      user.password = await util.hashPassword(currentPassword);

      fastifyRequestMock.session.user = user;
      const requestBody = new UpdatePasswordDto();

      requestBody.current = currentPassword;
      requestBody.new = newPassword;

      await securityController.updatePassword(fastifyRequestMock, requestBody);

      const mockCalls = userRepositoryMock.model.updateOne.mock.calls;
      const newPasswordHash = mockCalls[0][1].password;

      expect(mockCalls[0][0]).toStrictEqual({ _id: user._id });
      expect(newPasswordHash instanceof Buffer).toBeTruthy();
      expect(util.assertPassword(newPassword, newPasswordHash)).toBeTruthy();
    });
  });

  describe("enable2FA", () => {
    it(`should throw UnprocessableEntityException("${EXCEPTIONS_MESSAGES.PASSWORD_REQUIRED}")`, async () => {
      const user = mockUser();
      fastifyRequestMock.session.user = user;

      const requestBody = new Enable2FADto();
      requestBody.target = user.phones[0];

      await expect(
        securityController.enable2FA(fastifyRequestMock, requestBody),
      ).rejects.toStrictEqual(
        new UnprocessableEntityException(EXCEPTIONS_MESSAGES.PASSWORD_REQUIRED),
      );
    });

    it(`should throw UnprocessableEntityException("${EXCEPTIONS_MESSAGES.NOT_OWN_CONTACT}")`, async () => {
      const user = mockUser();
      const password = faker.internet.password();
      user.password = await util.hashPassword(password);

      fastifyRequestMock.session.user = user;

      const requestBody = new Enable2FADto();
      requestBody.target = "awaysvalid@email.com";

      await expect(
        securityController.enable2FA(fastifyRequestMock, requestBody),
      ).rejects.toStrictEqual(
        new UnprocessableEntityException(EXCEPTIONS_MESSAGES.NOT_OWN_CONTACT),
      );
    });

    it(`should enable`, async () => {
      const user = mockUser();
      const password = faker.internet.password();
      user.password = await util.hashPassword(password);

      fastifyRequestMock.session.user = user;

      const requestBody = new Enable2FADto();
      requestBody.target = user.phones[0];

      await securityController.enable2FA(fastifyRequestMock, requestBody);

      const mockCalls = userRepositoryMock.update.mock.calls;

      expect(mockCalls[0][0]).toStrictEqual({ _id: user._id });
      expect(mockCalls[0][1]).toStrictEqual({ "2fa": user.phones[0] });
    });
  });

  describe("disable2FA", () => {
    it(`should throw UnprocessableEntityException("${EXCEPTIONS_MESSAGES.PASSWORD_REQUIRED}")`, async () => {
      const user = mockUser();
      fastifyRequestMock.session.user = user;

      const requestBody = new Disable2FADto();
      requestBody.password = "";

      await expect(
        securityController.disable2FA(fastifyRequestMock, requestBody),
      ).rejects.toStrictEqual(
        new UnprocessableEntityException(EXCEPTIONS_MESSAGES.PASSWORD_REQUIRED),
      );
    });

    it(`should throw UnprocessableEntityException("${EXCEPTIONS_MESSAGES.WRONG_PASSWORD}")`, async () => {
      const user = mockUser();
      const password = faker.internet.password();
      user.password = await util.hashPassword(password);

      fastifyRequestMock.session.user = user;

      const requestBody = new Disable2FADto();
      requestBody.password = "";

      await expect(
        securityController.disable2FA(fastifyRequestMock, requestBody),
      ).rejects.toStrictEqual(
        new UnprocessableEntityException(EXCEPTIONS_MESSAGES.WRONG_PASSWORD),
      );
    });

    it(`should disable`, async () => {
      const user = mockUser();
      const password = faker.internet.password();
      user.password = await util.hashPassword(password);

      fastifyRequestMock.session.user = user;

      const requestBody = new Disable2FADto();
      requestBody.password = password;

      await securityController.disable2FA(fastifyRequestMock, requestBody);

      const mockCalls = userRepositoryMock.update.mock.calls;

      expect(mockCalls[0][0]).toStrictEqual({ _id: user._id });
      expect(mockCalls[0][1]).toStrictEqual({ "2fa": "" });
    });
  });
});
