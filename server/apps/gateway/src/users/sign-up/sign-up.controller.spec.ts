/**
 * Sign-in Controller
 *
 * @group unit/controllers/sign-up
 */
import { Types } from "mongoose";
import {
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { SignUpController } from "./sign-up.controller";
import { PhoneVerificationCheckDto, SignUpDto } from "./sign-up.dto";
import SecurePassword from "secure-password";
import { EXCEPTIONS_MESSAGES, CACHE_NAMESPACES } from "../constants";
import faker from "faker";

describe("SignUpController", () => {
  const securePassword = new SecurePassword();

  let signUpController: SignUpController;

  const cacheServiceMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const userRepositoryMock = {
    get: jest.fn(),
    create: jest.fn(),
  };

  const verifyServiceMock = {
    request: jest.fn(),
    verify: jest.fn(),
  };

  const sessionServiceMock = {
    create: jest.fn(),
  };

  const fastifyRequestMock: any = {
    headers: {
      "user-agent": "foo",
    },
    raw: { headers: { "x-client-ip": "127.0.0.1" } },
  };

  const fastifyResponseMock = {
    code: jest.fn(),
    send: jest.fn(),
  };

  beforeEach(() => {
    signUpController = new SignUpController(
      cacheServiceMock as any,
      userRepositoryMock as any,
      verifyServiceMock as any,
      sessionServiceMock as any,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("phoneVerificationRequest", () => {
    it(`should throw UnprocessableEntityException('${EXCEPTIONS_MESSAGES.PHONE_REGISTRED}')`, async () => {
      userRepositoryMock.get.mockResolvedValue({});

      await expect(
        signUpController.phoneVerificationRequest(
          fastifyResponseMock as any,
          "foo",
        ),
      ).rejects.toStrictEqual(
        new UnprocessableEntityException(EXCEPTIONS_MESSAGES.PHONE_REGISTRED),
      );
    });

    it(`should response 202 verification created`, async () => {
      cacheServiceMock.get.mockResolvedValue(null);

      await signUpController.phoneVerificationRequest(
        fastifyResponseMock as any,
        "foo",
      );

      expect(fastifyResponseMock.code.mock.calls[0][0]).toBe(202);
      expect(fastifyResponseMock.send).toBeCalled();
    });

    it(`should response 200 verification already created`, async () => {
      cacheServiceMock.get.mockResolvedValue(null);

      await signUpController.phoneVerificationRequest(
        fastifyResponseMock as any,
        "foo",
      );

      expect(fastifyResponseMock.send).toBeCalled();
    });
  });

  describe("phoneVerificationCheck", () => {
    it(`should throw UnprocessableEntityException(${EXCEPTIONS_MESSAGES.WRONG_CODE})`, async () => {
      verifyServiceMock.verify.mockResolvedValue(false);

      const requestBody = new PhoneVerificationCheckDto();
      requestBody.phone = "+5582988884444";
      requestBody.code = "000000";

      await expect(
        signUpController.phoneVerificationCheck(
          fastifyResponseMock as any,
          requestBody,
        ),
      ).rejects.toStrictEqual(
        new UnprocessableEntityException(EXCEPTIONS_MESSAGES.WRONG_CODE),
      );
    });

    it(`should validate a contact verification`, async () => {
      verifyServiceMock.verify.mockResolvedValue(true);

      const requestBody = new PhoneVerificationCheckDto();
      requestBody.phone = "+5582988884444";
      requestBody.code = "000000";

      await signUpController.phoneVerificationCheck(
        fastifyResponseMock as any,
        requestBody,
      );

      expect(cacheServiceMock.set.mock.calls[0][0]).toBe(
        CACHE_NAMESPACES.REGISTRY_VERIFICATIONS,
      );
      expect(cacheServiceMock.set.mock.calls[0][1]).toBe(requestBody.phone);
      expect(cacheServiceMock.set.mock.calls[0][2]).toStrictEqual({
        code: requestBody.code,
        validated: true,
      });
      expect(fastifyResponseMock.code.mock.calls[0][0]).toBe(200);
      expect(fastifyResponseMock.send).toBeCalled();
    });
  });

  describe("signUp", () => {
    it(`should throw UnprocessableEntityException("${EXCEPTIONS_MESSAGES.TERMS_NOT_ACCEPTED}")`, async () => {
      const requestBody = new SignUpDto();
      requestBody.phone = "+5582988884444";
      requestBody.code = "000000";
      requestBody.firstName = faker.name.firstName();
      requestBody.lastName = faker.name.lastName();
      requestBody.cpf = "123.456.789-09";
      requestBody.birth = faker.date.past(18).toISOString();
      requestBody.terms = false;

      await expect(
        signUpController.signUp(
          fastifyRequestMock,
          fastifyResponseMock as any,
          requestBody,
        ),
      ).rejects.toStrictEqual(
        new UnprocessableEntityException(
          EXCEPTIONS_MESSAGES.TERMS_NOT_ACCEPTED,
        ),
      );
    });

    it(`should throw UnauthorizedException("${EXCEPTIONS_MESSAGES.VERIFICATION_NOT_FOUND}")`, async () => {
      const requestBody = new SignUpDto();
      requestBody.phone = "+5582988884444";
      requestBody.code = "000000";
      requestBody.firstName = faker.name.firstName();
      requestBody.lastName = faker.name.lastName();
      requestBody.cpf = "123.456.789-09";
      requestBody.birth = faker.date.past(18).toISOString();
      requestBody.terms = true;

      cacheServiceMock.get.mockResolvedValue(null);

      await expect(
        signUpController.signUp(
          fastifyRequestMock,
          fastifyResponseMock as any,
          requestBody,
        ),
      ).rejects.toStrictEqual(
        new UnauthorizedException(EXCEPTIONS_MESSAGES.PHONE_NOT_VERIFIED),
      );
    });

    it(`should throw UnauthorizedException("${EXCEPTIONS_MESSAGES.PHONE_NOT_VERIFIED}")`, async () => {
      const requestBody = new SignUpDto();
      requestBody.phone = "+5582988884444";
      requestBody.code = "000000";
      requestBody.firstName = faker.name.firstName();
      requestBody.lastName = faker.name.lastName();
      requestBody.cpf = "123.456.789-09";
      requestBody.birth = faker.date.past(18).toISOString();
      requestBody.terms = true;

      verifyServiceMock.verify.mockResolvedValue(false);

      await expect(
        signUpController.signUp(
          fastifyRequestMock,
          fastifyResponseMock as any,
          requestBody,
        ),
      ).rejects.toStrictEqual(
        new UnauthorizedException(EXCEPTIONS_MESSAGES.PHONE_NOT_VERIFIED),
      );
    });

    it(`should throw UnprocessableEntityException("${EXCEPTIONS_MESSAGES.INVALID_CPF}")`, async () => {
      const requestBody = new SignUpDto();
      requestBody.phone = "+5582988884444";
      requestBody.code = "000000";
      requestBody.firstName = faker.name.firstName();
      requestBody.lastName = faker.name.lastName();
      requestBody.cpf = "123.456.789-10";
      requestBody.birth = faker.date.past(18).toISOString();
      requestBody.terms = true;

      verifyServiceMock.verify.mockResolvedValue(true);

      await expect(
        signUpController.signUp(
          fastifyRequestMock,
          fastifyResponseMock as any,
          requestBody,
        ),
      ).rejects.toStrictEqual(
        new UnprocessableEntityException(EXCEPTIONS_MESSAGES.INVALID_CPF),
      );
    });

    it(`should throw UnprocessableEntityException("${EXCEPTIONS_MESSAGES.CPF_REGISTRED}")`, async () => {
      const requestBody = new SignUpDto();
      requestBody.phone = "+5582988884444";
      requestBody.code = "000000";
      requestBody.firstName = faker.name.firstName();
      requestBody.lastName = faker.name.lastName();
      requestBody.cpf = "123.456.789-09";
      requestBody.birth = faker.date.past(18).toISOString();
      requestBody.terms = true;

      userRepositoryMock.get.mockResolvedValueOnce(null);
      userRepositoryMock.get.mockResolvedValueOnce({ cpf: requestBody.cpf });

      verifyServiceMock.verify.mockResolvedValue(true);

      await expect(
        signUpController.signUp(
          fastifyRequestMock,
          fastifyResponseMock as any,
          requestBody,
        ),
      ).rejects.toStrictEqual(
        new UnprocessableEntityException(EXCEPTIONS_MESSAGES.CPF_REGISTRED),
      );
    });

    it(`should registry user and creates a session`, async () => {
      const token = "JWT_TOKEN";
      const user = {
        _id: new Types.ObjectId(),
      };

      const requestBody = new SignUpDto();
      requestBody.phone = "+5582988884444";
      requestBody.code = "000000";
      requestBody.firstName = faker.name.firstName();
      requestBody.lastName = faker.name.lastName();
      requestBody.cpf = "123.456.789-09";
      requestBody.birth = faker.date.past(18).toISOString();
      requestBody.terms = true;

      verifyServiceMock.verify.mockResolvedValue(true);
      userRepositoryMock.create.mockResolvedValue(user);
      sessionServiceMock.create.mockResolvedValue({ token });

      await signUpController.signUp(
        fastifyRequestMock,
        fastifyResponseMock as any,
        requestBody,
      );

      expect(fastifyResponseMock.code.mock.calls[0][0]).toBe(201);
      expect(fastifyResponseMock.send.mock.calls[0][0]).toStrictEqual({
        user: {
          id: user._id,
        },
        session: {
          token,
        },
      });
    });
  });
});
