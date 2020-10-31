/**
 * @group unit/controller
 * @group unit/gateway/controller
 * @group unit/gateway/user/controller
 * @group unit/gateway/user/auth
 * @group unit/gateway/user/auth/controller
 */
import { Test } from "@nestjs/testing";
import { LoggerModule } from "nestjs-pino";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule, CacheService } from "@app/cache";
import { RepositoryModule } from "@app/repositories";
import { AuthModule, AuthService } from "@app/auth";
import {
  ContactVerificationModule,
  TwilioService,
} from "@app/contact-verification";
import {
  IAuthIdentifyResponse,
  IAuthPasswordResponse,
  IAuthCodeResponse,
  IUser,
} from "@shared/interfaces";
import { UserModule } from "../user.module";
import { UserService } from "../user.service";
import { ContactDto } from "../user.dto";
import { mockUser, mockSession, mockPhone } from "@testing/testing";
import { UserAuthController } from "./auth.controller";
import faker from "faker";
import { ContactVerificationCheckDto } from "../user.dto";
import { AuthPasswordDto } from "../user.dto";

describe("SignInController", () => {
  let controller: UserAuthController;
  let usersService: UserService;
  let sessionService: AuthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        LoggerModule.forRoot(),
        AuthModule,
        CacheModule,
        RepositoryModule,
        ContactVerificationModule,
        UserModule,
      ],
      controllers: [UserAuthController],
    })
      .overrideProvider(ConfigService)
      .useValue({ get() {} })
      .overrideProvider(CacheService)
      .useValue({})
      .overrideProvider(TwilioService)
      .useValue({})
      .compile();

    sessionService = moduleRef.get<AuthService>(AuthService);
    usersService = moduleRef.get<UserService>(UserService);
    controller = moduleRef.get<UserAuthController>(UserAuthController);
  });

  describe("identifyHandler", () => {
    function makeMocks(userOverride?: Partial<IUser>) {
      const user = mockUser(userOverride);
      const [contact] = user.phones;
      const findByContact = jest.spyOn(usersService, "findByContact");
      const requestContactVerify = jest.spyOn(
        usersService,
        "requestContactVerify",
      );
      const contactDto = new ContactDto();
      contactDto.contact = contact;

      findByContact.mockResolvedValueOnce(user);
      requestContactVerify.mockResolvedValueOnce("");

      return { user, contact, contactDto, findByContact, requestContactVerify };
    }

    it("should return seconda factor required response", async () => {
      const {
        user,
        contact,
        contactDto,
        findByContact,
        requestContactVerify,
      } = makeMocks();
      const response = await controller.identifyHandler(contactDto);

      expect(findByContact).toBeCalledWith(contact);
      expect(requestContactVerify).toBeCalledWith(contact);
      expect(response).toStrictEqual<IAuthIdentifyResponse>({
        next: "code",
      });
    });

    it("should return password required response", async () => {
      const {
        user,
        contact,
        contactDto,
        findByContact,
        requestContactVerify,
      } = makeMocks({ password: faker.internet.password() });
      const response = await controller.identifyHandler(contactDto);

      expect(findByContact).toBeCalledWith(contact);
      expect(requestContactVerify).not.toBeCalled();
      expect(response).toStrictEqual<IAuthIdentifyResponse>({
        next: "password",
      });
    });
  });

  describe("passwordHandler", () => {
    function makeMocks(userOverride?: Partial<IUser>) {
      const ip = faker.internet.ip();
      const userAgent = faker.internet.userAgent();
      const user = mockUser({
        ...userOverride,
        password: faker.internet.password(),
      });
      const {
        phones: [contact],
      } = user;
      const findByContact = jest.spyOn(usersService, "findByContact");
      const assertPassword = jest.spyOn(usersService, "assertPassword");
      const authPasswordDto = new AuthPasswordDto();
      authPasswordDto.contact = contact;
      authPasswordDto.password = user.password as string;

      findByContact.mockResolvedValueOnce(user);
      assertPassword.mockResolvedValueOnce();

      return {
        ip,
        userAgent,
        user,
        contact,
        findByContact,
        assertPassword,
        authPasswordDto,
      };
    }

    it("should return authorized response", async () => {
      const token = faker.random.alphaNumeric(12);
      const session = mockSession();
      const {
        ip,
        userAgent,
        user,
        contact,
        findByContact,
        assertPassword,
        authPasswordDto,
      } = makeMocks();
      const sessionCreate = jest.spyOn(sessionService, "create");
      sessionCreate.mockResolvedValue({ token, session });

      const result = await controller.passwordHandler(
        ip,
        userAgent,
        authPasswordDto,
      );

      expect(findByContact).toBeCalledWith(contact);
      expect(assertPassword).toBeCalledWith(user, user.password);
      expect(result).toStrictEqual<IAuthPasswordResponse>({
        next: "authorized",
        body: { token },
      });
    });

    it("should return seconda factor required response", async () => {
      const token = faker.random.alphaNumeric(12);
      const phone = mockPhone();
      const session = mockSession();
      const {
        ip,
        userAgent,
        user,
        contact,
        findByContact,
        assertPassword,
        authPasswordDto,
      } = makeMocks({ "2fa": phone });
      const sessionCreate = jest.spyOn(sessionService, "create");
      sessionCreate.mockResolvedValue({ token, session });

      const requestVerify = jest
        .spyOn(usersService, "requestContactVerify")
        .mockResolvedValue(phone);

      const result = await controller.passwordHandler(
        ip,
        userAgent,
        authPasswordDto,
      );

      expect(findByContact).toBeCalledWith(contact);
      expect(requestVerify).toBeCalledWith(phone);
      expect(assertPassword).toBeCalledWith(user, authPasswordDto.password);
      expect(result).toStrictEqual<IAuthPasswordResponse>({
        next: "code",
        body: { target: phone },
      });
    });
  });

  describe("codeHandler", () => {
    it("should return authorized response", async () => {
      const user = mockUser();
      const [contact] = user.phones;
      const session = mockSession();
      const ip = faker.internet.ip();
      const userAgent = faker.internet.userAgent();
      const token = faker.random.alphaNumeric(12);
      const code = "000000";
      const contactVerificationCheckDto = new ContactVerificationCheckDto();
      contactVerificationCheckDto.contact = contact;
      contactVerificationCheckDto.code = code;

      const verifyContact = jest
        .spyOn(usersService, "verifyContact")
        .mockResolvedValue("email");
      const findByContact = jest
        .spyOn(usersService, "findByContact")
        .mockResolvedValue(user);
      const sessionCreate = jest
        .spyOn(sessionService, "create")
        .mockResolvedValue({ token, session });

      const response = await controller.codeHandler(
        ip,
        userAgent,
        contactVerificationCheckDto,
      );

      expect(response).toStrictEqual<IAuthCodeResponse>({
        next: "authorized",
        body: { token },
      });
      expect(verifyContact).toBeCalledWith(contact, code);
      expect(findByContact).toBeCalledWith(contact);
      expect(sessionCreate).toBeCalledWith(user, userAgent, ip);
    });
  });
});
