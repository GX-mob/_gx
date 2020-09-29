/**
 * Sign-in Controller
 *
 * @group unit/controllers/sign-in
 */
import {
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { SignInController } from "./sign-in.controller";
import { SignInPasswordDto, SignInCodeDto } from "./sign-in.dto";
import SecurePassword from "secure-password";
import { HTTP_EXCEPTIONS_MESSAGES } from "@shared/http-exceptions";
import { util } from "@app/helpers";

describe("SignInController", () => {
  const securePassword = new SecurePassword();

  let signInController: SignInController;

  const userRepositoryMock = {
    get: jest.fn(),
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
    signInController = new SignInController(
      userRepositoryMock as any,
      verifyServiceMock as any,
      sessionServiceMock as any,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("identify", () => {
    it(`should throw NotFoundException('${HTTP_EXCEPTIONS_MESSAGES.USER_NOT_FOUND}')`, async () => {
      const result = null;
      userRepositoryMock.get.mockResolvedValue(result);

      await expect(
        signInController.identify(fastifyResponseMock as any, "foo"),
      ).rejects.toStrictEqual(
        new NotFoundException(HTTP_EXCEPTIONS_MESSAGES.USER_NOT_FOUND),
      );
    });

    it("should return user data", async () => {
      const result = {
        password: Buffer.from("foo"),
        phones: ["+5592088444444"],
        firstName: "Foo",
        avatar: "https://",
      };
      userRepositoryMock.get.mockResolvedValue(result);
      await signInController.identify(fastifyResponseMock as any, "foo");

      expect(fastifyResponseMock.send.mock.calls[0][0]).toMatchObject({
        firstName: result.firstName,
        avatar: result.avatar,
      });
    });

    it("should return user data and request a 2fa", async () => {
      const result = {
        phones: ["+5592088444444"],
        firstName: "Foo",
        avatar: "https://",
      };
      userRepositoryMock.get.mockResolvedValue(result);
      await signInController.identify(fastifyResponseMock as any, "foo");

      expect(fastifyResponseMock.send.mock.calls[0][0]).toMatchObject({
        firstName: result.firstName,
        avatar: result.avatar,
      });
      expect(fastifyResponseMock.code.mock.calls[0][0]).toBe(202);
    });
  });

  describe("signIn", () => {
    it(`should throw UnprocessableEntityException('${HTTP_EXCEPTIONS_MESSAGES.WRONG_PASSWORD}')`, async () => {
      const phone = "+5592088444444";
      const result = {
        password: await securePassword.hash(Buffer.from("123")),
        phones: [phone],
        firstName: "Foo",
        avatar: "https://",
      };
      userRepositoryMock.get.mockResolvedValue(result);

      const signInPasswordDto = new SignInPasswordDto();

      signInPasswordDto.phone = phone;
      signInPasswordDto.password = "wrong";

      await expect(
        signInController.signIn(
          fastifyRequestMock,
          fastifyResponseMock as any,
          signInPasswordDto,
        ),
      ).rejects.toStrictEqual(
        new UnprocessableEntityException(
          HTTP_EXCEPTIONS_MESSAGES.WRONG_PASSWORD,
        ),
      );
    });

    it("should authorize ", async () => {
      const phone = "+5592088444444";
      const password = "123";
      const token = "foo";
      const result = {
        password: await securePassword.hash(Buffer.from(password)),
        phones: [phone],
        firstName: "Foo",
        avatar: "https://",
      };
      userRepositoryMock.get.mockResolvedValue(result);
      sessionServiceMock.create.mockResolvedValue({ token });

      const signInPasswordDto = new SignInPasswordDto();

      signInPasswordDto.phone = phone;
      signInPasswordDto.password = password;

      await signInController.signIn(
        fastifyRequestMock,
        fastifyResponseMock as any,
        signInPasswordDto,
      );

      expect(fastifyResponseMock.send.mock.calls[0][0].token).toBe(token);
      expect(fastifyResponseMock.code.mock.calls[0][0]).toBe(201);
    });

    it("should response 2fa request", async () => {
      const phone = "+5592088444444";
      const password = "123";
      const result = {
        password: await securePassword.hash(Buffer.from(password)),
        phones: [phone],
        firstName: "Foo",
        avatar: "https://",
        "2fa": phone,
      };
      userRepositoryMock.get.mockResolvedValue(result);

      const signInPasswordDto = new SignInPasswordDto();

      signInPasswordDto.phone = phone;
      signInPasswordDto.password = password;

      await signInController.signIn(
        fastifyRequestMock,
        fastifyResponseMock as any,
        signInPasswordDto,
      );

      expect(fastifyResponseMock.send.mock.calls[0][0].target).toBe(
        phone.slice(phone.length - 4),
      );
      expect(fastifyResponseMock.code.mock.calls[0][0]).toBe(202);
    });

    it("should response 2fa request, email field", async () => {
      const phone = "+5592088444444";
      const email = "valid@email.com";
      const password = "123";
      const result = {
        password: await securePassword.hash(Buffer.from(password)),
        phones: [phone],
        emails: [email],
        firstName: "Foo",
        avatar: "https://",
        "2fa": email,
      };
      userRepositoryMock.get.mockResolvedValue(result);

      const signInPasswordDto = new SignInPasswordDto();

      signInPasswordDto.phone = phone;
      signInPasswordDto.password = password;

      await signInController.signIn(
        fastifyRequestMock,
        fastifyResponseMock as any,
        signInPasswordDto,
      );

      expect(fastifyResponseMock.send.mock.calls[0][0].target).toBe(
        util.hideEmail(email),
      );
      expect(fastifyResponseMock.code.mock.calls[0][0]).toBe(202);
    });
  });

  describe("code", () => {
    it(`should throw UnprocessableEntityException('${HTTP_EXCEPTIONS_MESSAGES.WRONG_CODE}')`, async () => {
      const phone = "+5592088444444";
      const result = {
        password: await securePassword.hash(Buffer.from("123")),
        phones: [phone],
        firstName: "Foo",
        avatar: "https://",
      };
      userRepositoryMock.get.mockResolvedValue(result);

      const signInCodeDto = new SignInCodeDto();

      signInCodeDto.phone = phone;
      signInCodeDto.code = "wrong";

      await expect(
        signInController.code(
          fastifyRequestMock,
          fastifyResponseMock as any,
          signInCodeDto,
        ),
      ).rejects.toStrictEqual(
        new UnprocessableEntityException(HTTP_EXCEPTIONS_MESSAGES.WRONG_CODE),
      );
    });

    it("should authorize", async () => {
      const phone = "+5592088444444";
      const code = "123";
      const token = "foo";
      const result = {
        phones: [phone],
        firstName: "Foo",
        avatar: "https://",
      };
      userRepositoryMock.get.mockResolvedValue(result);
      verifyServiceMock.verify.mockResolvedValue(true);
      sessionServiceMock.create.mockResolvedValue({ token });
      const signInCodeDto = new SignInCodeDto();

      signInCodeDto.phone = phone;
      signInCodeDto.code = code;

      await signInController.code(
        fastifyRequestMock,
        fastifyResponseMock as any,
        signInCodeDto,
      );

      const verifyCalls = verifyServiceMock.verify.mock.calls;

      expect(verifyCalls[0][0]).toBe(phone);
      expect(verifyCalls[0][1]).toBe(code);

      expect(fastifyResponseMock.send.mock.calls[0][0].token).toBe(token);
      expect(fastifyResponseMock.code.mock.calls[0][0]).toBe(201);
    });
  });
});
