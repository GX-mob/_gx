/**
 * Sign-in Controller
 *
 * @group unit/controllers/contact
 */
import { Types } from "mongoose";
import { UnprocessableEntityException } from "@nestjs/common";
import { AccountContactController } from "./contact.controller";
import {
  ContactVerifyRequestDto,
  ConfirmContactVerificationDto,
  RemoveContactDto,
} from "./dto";
import SecurePassword from "secure-password";
import { EXCEPTIONS_MESSAGES } from "../constants";

describe("AccountContactController", () => {
  const securePassword = new SecurePassword();

  let contactController: AccountContactController;

  const userRepositoryMock = {
    get: jest.fn(),
    update: jest.fn(),
  };

  const verifyServiceMock = {
    request: jest.fn(),
    verify: jest.fn(),
  };

  let fastifyRequestMock: any = {
    headers: {
      "user-agent": "foo",
    },
    raw: { headers: { "x-client-ip": "127.0.0.1" } },
    session: { user: {} },
  };

  beforeEach(() => {
    contactController = new AccountContactController(
      userRepositoryMock as any,
      verifyServiceMock as any,
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

  describe("verifiContactRequest", () => {
    it("should create phone verification", async () => {
      const requestBody = new ContactVerifyRequestDto();

      requestBody.contact = "+5582988444444";

      contactController.verifiContactRequest(requestBody);
    });

    it(`should throw UnprocessableEntityException("${EXCEPTIONS_MESSAGES.CONTACT_ALREADY_REGISTRED}")`, async () => {
      const requestBody = new ContactVerifyRequestDto();

      requestBody.contact = "+5582988444444";
      userRepositoryMock.get.mockResolvedValue({});

      await expect(
        contactController.verifiContactRequest(requestBody),
      ).rejects.toStrictEqual(
        new UnprocessableEntityException(
          EXCEPTIONS_MESSAGES.CONTACT_ALREADY_REGISTRED,
        ),
      );
    });
  });

  describe("addContact", () => {
    it(`should throw UnprocessableEntityException("${EXCEPTIONS_MESSAGES.WRONG_CODE}")`, async () => {
      const requestBody = new ConfirmContactVerificationDto();
      requestBody.contact = "+5582988444444";
      requestBody.code = "000000";

      verifyServiceMock.verify.mockResolvedValue(false);

      await expect(
        contactController.addContact(fastifyRequestMock, requestBody),
      ).rejects.toStrictEqual(
        new UnprocessableEntityException(EXCEPTIONS_MESSAGES.WRONG_CODE),
      );
    });

    it(`should add a phone number`, async () => {
      const requestBody = new ConfirmContactVerificationDto();
      requestBody.contact = "+5582988444444";
      requestBody.code = "000000";
      const requestMock = { ...fastifyRequestMock };

      const _id = new Types.ObjectId();

      requestMock.session.user._id = _id;

      verifyServiceMock.verify.mockResolvedValue(true);

      await contactController.addContact(fastifyRequestMock, requestBody);

      expect(userRepositoryMock.update.mock.calls[0][0]).toStrictEqual({
        _id,
      });
      expect(userRepositoryMock.update.mock.calls[0][1]).toStrictEqual({
        phones: [requestBody.contact],
      });
    });

    it(`should append a phone number`, async () => {
      const requestBody = new ConfirmContactVerificationDto();
      requestBody.contact = "+5582988444444";
      requestBody.code = "000000";
      const requestMock = { ...fastifyRequestMock };

      const _id = new Types.ObjectId();

      requestMock.session.user._id = _id;
      requestMock.session.user.phones = ["+5582988884444"];

      verifyServiceMock.verify.mockResolvedValue(true);

      await contactController.addContact(fastifyRequestMock, requestBody);

      expect(userRepositoryMock.update.mock.calls[0][0]).toStrictEqual({
        _id,
      });
      expect(userRepositoryMock.update.mock.calls[0][1]).toStrictEqual({
        phones: [requestMock.session.user.phones[0], requestBody.contact],
      });
    });

    it(`should add an email`, async () => {
      const requestBody = new ConfirmContactVerificationDto();
      requestBody.contact = "valid@email.com";
      requestBody.code = "000000";
      const requestMock = { ...fastifyRequestMock };

      const _id = new Types.ObjectId();

      requestMock.session.user._id = _id;

      verifyServiceMock.verify.mockResolvedValue(true);

      await contactController.addContact(fastifyRequestMock, requestBody);

      expect(userRepositoryMock.update.mock.calls[0][0]).toStrictEqual({
        _id,
      });
      expect(userRepositoryMock.update.mock.calls[0][1]).toStrictEqual({
        emails: [requestBody.contact],
      });
    });

    it(`should append an email`, async () => {
      const requestBody = new ConfirmContactVerificationDto();
      requestBody.contact = "valid@email.com";
      requestBody.code = "000000";
      const requestMock = { ...fastifyRequestMock };

      const _id = new Types.ObjectId();

      requestMock.session.user._id = _id;
      requestMock.session.user.emails = ["current@email.com"];

      verifyServiceMock.verify.mockResolvedValue(true);

      await contactController.addContact(fastifyRequestMock, requestBody);

      expect(userRepositoryMock.update.mock.calls[0][0]).toStrictEqual({
        _id,
      });
      expect(userRepositoryMock.update.mock.calls[0][1]).toStrictEqual({
        emails: [requestMock.session.user.emails[0], requestBody.contact],
      });
    });
  });

  describe("removeContact", () => {
    it(`should throw UnprocessableEntityException("${EXCEPTIONS_MESSAGES.REMOVE_CONTACT_NOT_ALLOWED}") due to removing last contact`, async () => {
      const password = "test";
      const passwordHashBuffer = await securePassword.hash(
        Buffer.from(password),
      );
      const requestMock = { ...fastifyRequestMock };

      const _id = new Types.ObjectId();
      const currentPhone = "+5582988444444";

      requestMock.session.user._id = _id;
      requestMock.session.user.phones = [currentPhone];
      requestMock.session.user.emails = [];
      requestMock.session.user.password = passwordHashBuffer;

      const requestBody = new RemoveContactDto();
      requestBody.contact = currentPhone;

      await expect(
        contactController.removeContact(fastifyRequestMock, requestBody),
      ).rejects.toStrictEqual(
        new UnprocessableEntityException(
          EXCEPTIONS_MESSAGES.REMOVE_CONTACT_NOT_ALLOWED,
        ),
      );
    });

    it(`should throw UnprocessableEntityException("${EXCEPTIONS_MESSAGES.REMOVE_CONTACT_NOT_ALLOWED}") due to removing 2FA`, async () => {
      const password = "test";
      const passwordHashBuffer = await securePassword.hash(
        Buffer.from(password),
      );
      const requestMock = { ...fastifyRequestMock };

      const _id = new Types.ObjectId();
      const currentPhone = "+5582988444444";

      requestMock.session.user._id = _id;
      requestMock.session.user.phones = [currentPhone];
      requestMock.session.user.emails = [];
      requestMock.session.user.password = passwordHashBuffer;

      const requestBody = new RemoveContactDto();
      requestBody.contact = currentPhone;

      await expect(
        contactController.removeContact(fastifyRequestMock, requestBody),
      ).rejects.toStrictEqual(
        new UnprocessableEntityException(
          EXCEPTIONS_MESSAGES.REMOVE_CONTACT_NOT_ALLOWED,
        ),
      );
    });

    it(`should remove a phone number`, async () => {
      const password = "test";
      const passwordHashBuffer = await securePassword.hash(
        Buffer.from(password),
      );
      const requestMock = { ...fastifyRequestMock };

      const _id = new Types.ObjectId();
      const toRemove = "+5582988444444";

      requestMock.session.user._id = _id;
      requestMock.session.user.phones = [toRemove];
      requestMock.session.user.emails = ["valid@email.com"];
      requestMock.session.user.password = passwordHashBuffer;

      const requestBody = new RemoveContactDto();
      requestBody.contact = toRemove;

      await contactController.removeContact(fastifyRequestMock, requestBody);
      expect(userRepositoryMock.update.mock.calls[0][0]).toStrictEqual({
        _id,
      });
      expect(userRepositoryMock.update.mock.calls[0][1]).toStrictEqual({
        phones: [],
      });
    });

    it(`should remove an email `, async () => {
      const password = "test";
      const passwordHashBuffer = await securePassword.hash(
        Buffer.from(password),
      );
      const requestMock = { ...fastifyRequestMock };

      const _id = new Types.ObjectId();
      const toRemove = "valid@email.com";

      requestMock.session.user._id = _id;
      requestMock.session.user.phones = ["+5582988444444"];
      requestMock.session.user.emails = [toRemove];
      requestMock.session.user.password = passwordHashBuffer;

      const requestBody = new RemoveContactDto();
      requestBody.contact = toRemove;

      await contactController.removeContact(fastifyRequestMock, requestBody);
      expect(userRepositoryMock.update.mock.calls[0][0]).toStrictEqual({
        _id,
      });
      expect(userRepositoryMock.update.mock.calls[0][1]).toStrictEqual({
        emails: [],
      });
    });
  });
});
