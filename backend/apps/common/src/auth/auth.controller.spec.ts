import {
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SignInPasswordDto, SignInCodeDto } from "./auth.dto";
import SecurePassword from "secure-password";
import { EXCEPTIONS_MESSAGES } from "./constants";

describe("CatsController", () => {
  const securePassword = new SecurePassword();

  let authController: AuthController;
  let authService: AuthService;

  const dataServiceMock = {
    users: {
      get: jest.fn(),
    },
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
  };

  beforeEach(() => {
    authService = new AuthService(
      dataServiceMock as any,
      verifyServiceMock as any,
      sessionServiceMock as any,
    );
    authController = new AuthController(authService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("getUser", () => {
    it(`should throw NotFoundException('${EXCEPTIONS_MESSAGES.USER_NOT_FOUND}')`, async () => {
      const result = null;
      dataServiceMock.users.get.mockResolvedValue(result);

      try {
        await authController.identify("foo", fastifyResponseMock as any);
      } catch (error) {
        expect(error instanceof NotFoundException).toBeTruthy();
        expect(error.message).toBe(EXCEPTIONS_MESSAGES.USER_NOT_FOUND);
      }
    });

    it("should return user data", async () => {
      const result = {
        password: Buffer.from("foo"),
        phones: ["+5592088444444"],
        firstName: "Foo",
        avatar: "https://",
      };
      dataServiceMock.users.get.mockResolvedValue(result);

      expect(
        await authController.identify("foo", fastifyResponseMock as any),
      ).toMatchObject({
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
      dataServiceMock.users.get.mockResolvedValue(result);

      expect(
        await authController.identify("foo", fastifyResponseMock as any),
      ).toMatchObject({
        firstName: result.firstName,
        avatar: result.avatar,
      });
      expect(fastifyResponseMock.code.mock.calls[0][0]).toBe(202);
    });

    it(`should throw UnprocessableEntityException('${EXCEPTIONS_MESSAGES.WRONG_PASSWORD}')`, async () => {
      const phone = "+5592088444444";
      const result = {
        password: await securePassword.hash(Buffer.from("123")),
        phones: [phone],
        firstName: "Foo",
        avatar: "https://",
      };
      dataServiceMock.users.get.mockResolvedValue(result);

      const signInPasswordDto = new SignInPasswordDto();

      signInPasswordDto.phone = phone;
      signInPasswordDto.password = "wrong";

      try {
        await authController.signIn(
          fastifyRequestMock,
          fastifyResponseMock as any,
          signInPasswordDto,
        );
      } catch (error) {
        expect(error instanceof UnprocessableEntityException).toBeTruthy();
        expect(error.message).toBe(EXCEPTIONS_MESSAGES.WRONG_PASSWORD);
      }
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
      dataServiceMock.users.get.mockResolvedValue(result);
      sessionServiceMock.create.mockResolvedValue({ token });

      const signInPasswordDto = new SignInPasswordDto();

      signInPasswordDto.phone = phone;
      signInPasswordDto.password = password;

      const response = await authController.signIn(
        fastifyRequestMock,
        fastifyResponseMock as any,
        signInPasswordDto,
      );

      expect(response.token).toBe(token);
      expect(fastifyResponseMock.code.mock.calls[0][0]).toBe(201);
    });

    it("should response 2fa request", async () => {
      const phone = "+5592088444444";
      const password = "123";
      const token = "foo";
      const result = {
        password: await securePassword.hash(Buffer.from(password)),
        phones: [phone],
        firstName: "Foo",
        avatar: "https://",
        "2fa": phone,
      };
      dataServiceMock.users.get.mockResolvedValue(result);

      const fastifyRequestMock: any = {
        headers: {
          "user-agent": "foo",
        },
        raw: { headers: { "x-client-ip": "127.0.0.1" } },
      };
      const signInPasswordDto = new SignInPasswordDto();

      signInPasswordDto.phone = phone;
      signInPasswordDto.password = password;

      const response = await authController.signIn(
        fastifyRequestMock,
        fastifyResponseMock as any,
        signInPasswordDto,
      );

      expect(response.target).toBe(phone.slice(phone.length - 4));
      expect(fastifyResponseMock.code.mock.calls[0][0]).toBe(202);
    });

    it(`should throw UnprocessableEntityException('${EXCEPTIONS_MESSAGES.WRONG_CODE}')`, async () => {
      const phone = "+5592088444444";
      const result = {
        password: await securePassword.hash(Buffer.from("123")),
        phones: [phone],
        firstName: "Foo",
        avatar: "https://",
      };
      dataServiceMock.users.get.mockResolvedValue(result);

      const fastifyRequestMock: any = {};
      const signInCodeDto = new SignInCodeDto();

      signInCodeDto.phone = phone;
      signInCodeDto.code = "wrong";

      try {
        await authController.code(
          fastifyRequestMock,
          fastifyResponseMock as any,
          signInCodeDto,
        );
      } catch (error) {
        expect(error instanceof UnprocessableEntityException).toBeTruthy();
        expect(error.message).toBe(EXCEPTIONS_MESSAGES.WRONG_CODE);
      }
    });
  });
});
