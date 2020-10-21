/**
 * @group unit/controller
 * @group unit/gateway/controller
 * @group unit/gateway/users/controller
 * @group unit/gateway/users/auth
 * @group unit/gateway/users/auth/controller
 */
import { Test } from "@nestjs/testing";
import { LoggerModule } from "nestjs-pino";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule, CacheService } from "@app/cache";
import { RepositoryModule, RepositoryService } from "@app/repositories";
import { SessionModule, SessionService } from "@app/session";
import {
  ContactVerificationModule,
  TwilioService,
} from "@app/contact-verification";
import {
  SignInIdentify,
  SignInPasswordResponse,
  SignInCodeResponse,
  IUser,
} from "@shared/interfaces";
import { UsersModule } from "../users.module";
import { UsersService } from "../users.service";
import { ContactDto, ContactVerificationCheckDto } from "../users.dto";
import { mockUser, mockSession, mockPhone } from "@testing/testing";
import { SignInController } from "./signin.controller";
import faker from "faker";
import { SignInCodeDto, SignInPasswordDto } from "./signin.dto";

describe("SignInController", () => {
  let controller: SignInController;
  let usersService: UsersService;
  let sessionService: SessionService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        LoggerModule.forRoot(),
        SessionModule,
        CacheModule,
        RepositoryModule,
        ContactVerificationModule,
        UsersModule,
      ],
      controllers: [SignInController],
    })
      .overrideProvider(ConfigService)
      .useValue({ get() {} })
      .overrideProvider(CacheService)
      .useValue({})
      .overrideProvider(RepositoryService)
      .useValue({})
      .overrideProvider(TwilioService)
      .useValue({})
      .compile();

    sessionService = moduleRef.get<SessionService>(SessionService);
    usersService = moduleRef.get<UsersService>(UsersService);
    controller = moduleRef.get<SignInController>(SignInController);
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
      const [[findByContactArg0]] = findByContact.mock.calls;
      const [[requestContactVerifyArg0]] = requestContactVerify.mock.calls;

      expect(findByContactArg0).toBe(contact);
      expect(requestContactVerifyArg0).toBe(contact);
      expect(response).toStrictEqual<SignInIdentify>({
        next: "code",
        body: { avatar: user.avatar, firstName: user.firstName },
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
      const [[findByContactArg0]] = findByContact.mock.calls;

      expect(findByContactArg0).toBe(contact);
      expect(requestContactVerify).not.toBeCalled();
      expect(response).toStrictEqual<SignInIdentify>({
        next: "password",
        body: { avatar: user.avatar, firstName: user.firstName },
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
      const signInPasswordDto = new SignInPasswordDto();
      signInPasswordDto.contact = contact;
      signInPasswordDto.password = user.password as string;

      findByContact.mockResolvedValueOnce(user);
      assertPassword.mockResolvedValueOnce();

      return {
        ip,
        userAgent,
        user,
        contact,
        findByContact,
        assertPassword,
        signInPasswordDto,
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
        signInPasswordDto,
      } = makeMocks();
      const sessionCreate = jest.spyOn(sessionService, "create");
      sessionCreate.mockResolvedValue({ token, session });

      const result = await controller.passwordHandler(
        ip,
        userAgent,
        signInPasswordDto,
      );
      const [[findByContactArg0]] = findByContact.mock.calls;
      const [
        [assertPasswordArg0, assertPasswordArg1],
      ] = assertPassword.mock.calls;

      expect(findByContactArg0).toBe(contact);
      expect(assertPasswordArg0).toStrictEqual(user);
      expect(assertPasswordArg1).toStrictEqual(user.password);
      expect(result).toStrictEqual<SignInPasswordResponse>({
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
        signInPasswordDto,
      } = makeMocks({ "2fa": phone });
      const sessionCreate = jest.spyOn(sessionService, "create");
      sessionCreate.mockResolvedValue({ token, session });

      const requestVerify = jest
        .spyOn(usersService, "requestContactVerify")
        .mockResolvedValue(phone);

      const result = await controller.passwordHandler(
        ip,
        userAgent,
        signInPasswordDto,
      );
      const [[findByContactArg0]] = findByContact.mock.calls;
      const [
        [assertPasswordArg0, assertPasswordArg1],
      ] = assertPassword.mock.calls;
      const [[requestVerifyArg0]] = requestVerify.mock.calls;

      expect(findByContactArg0).toBe(contact);
      expect(assertPasswordArg0).toStrictEqual(user);
      expect(assertPasswordArg1).toStrictEqual(user.password);
      expect(requestVerifyArg0).toBe(phone);
      expect(result).toStrictEqual<SignInPasswordResponse>({
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
      const signInCodeDto = new SignInCodeDto();
      signInCodeDto.contact = contact;
      signInCodeDto.code = code;

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
        signInCodeDto,
      );
      const [[verifyContactArg0, verifyContactArg1]] = verifyContact.mock.calls;
      const [[findByContactArg0]] = findByContact.mock.calls;
      const [
        [sessionCreateArg0, sessionCreateArg1, sessionCreateArg2],
      ] = sessionCreate.mock.calls;

      expect(response).toStrictEqual<SignInCodeResponse>({
        next: "authorized",
        body: { token },
      });
      expect(verifyContactArg0).toBe(contact);
      expect(verifyContactArg1).toBe(code);
      expect(findByContactArg0).toBe(contact);

      expect(sessionCreateArg0).toStrictEqual(user);
      expect(sessionCreateArg1).toBe(userAgent);
      expect(sessionCreateArg2).toBe(ip);
    });
  });
});
