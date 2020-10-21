/**
 * @group unit/controller
 * @group unit/gateway/controller
 * @group unit/gateway/users/controller
 * @group unit/gateway/users/register
 * @group unit/gateway/users/register/controller
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
import { UsersModule } from "../users.module";
import { UsersService } from "../users.service";
import { ContactDto, ContactVerificationCheckDto } from "../users.dto";
import { mockUser, mockSession } from "@testing/testing";
import faker from "faker";
import { SignUpController } from "./signup.controller";
import { SignUpDto } from "./signup.dto";

describe("SignUpController", () => {
  let controller: SignUpController;
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
      controllers: [SignUpController],
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
    controller = moduleRef.get<SignUpController>(SignUpController);
  });

  it("phoneVerificationRequest", async () => {
    const [contact] = mockUser().phones;
    const checkInUseContactSpy = jest
      .spyOn(usersService, "checkInUseContact")
      .mockImplementationOnce(async () => {});
    const requestContactVerifySpy = jest
      .spyOn(usersService, "requestContactVerify")
      .mockImplementationOnce(async () => "");

    const contactDto = new ContactDto();
    contactDto.contact = contact;

    await controller.phoneVerificationRequest(contactDto);

    const [[checkCallArg0]] = checkInUseContactSpy.mock.calls;
    const [[requestVerifyCallArg0]] = requestContactVerifySpy.mock.calls;

    expect(checkCallArg0).toBe(contact);
    expect(requestVerifyCallArg0).toBe(contact);
  });

  it("contactVerificationCheck", async () => {
    const [contact] = mockUser().phones;
    const code = "000000";
    const verifyContactSpy = jest
      .spyOn(usersService, "verifyContact")
      .mockImplementationOnce(async () => "phone");

    const contactVerificationCheckDto = new ContactVerificationCheckDto();
    contactVerificationCheckDto.contact = contact;
    contactVerificationCheckDto.code = code;

    await controller.contactVerificationCheck(contactVerificationCheckDto);

    const [[verifyCallArg0, verifyCallArg1]] = verifyContactSpy.mock.calls;

    expect(verifyCallArg0).toBe(contact);
    expect(verifyCallArg1).toBe(code);
  });

  it("signUp", async () => {
    const user = mockUser();
    const session = mockSession();
    const token = faker.random.alphaNumeric(12);
    const userAgent = faker.internet.userAgent();
    const ip = faker.internet.ip();
    const code = "000000";

    const checkInUseContactSpy = jest
      .spyOn(usersService, "checkInUseContact")
      .mockImplementationOnce(async () => {});
    const verifyContactSpy = jest
      .spyOn(usersService, "verifyContact")
      .mockImplementationOnce(async () => "phone");
    const userCreateSpy = jest
      .spyOn(usersService, "create")
      .mockImplementationOnce(async () => user);
    const sessionCreateSpy = jest
      .spyOn(sessionService, "create")
      .mockImplementationOnce(async () => ({ session, token }));

    const signUpDto = new SignUpDto();
    signUpDto.contact = user.phones[0];
    signUpDto.code = code;
    signUpDto.cpf = user.cpf;
    signUpDto.firstName = user.firstName;
    signUpDto.lastName = user.lastName;
    signUpDto.terms = true;
    signUpDto.birth = user.birth.toUTCString();

    const response = await controller.signUp(ip, userAgent, signUpDto);

    const [[checkCallArg0]] = checkInUseContactSpy.mock.calls;
    const [[verifyCallArg0, verifyCallArg1]] = verifyContactSpy.mock.calls;
    const [[createUserCallArg0, createUserCallArg1]] = userCreateSpy.mock.calls;
    const [
      [sessionCreateCallArg0, sessionCreateCallArg1, sessionCreateCallArg2],
    ] = sessionCreateSpy.mock.calls;

    // Security ensures calls
    expect(checkCallArg0).toBe(user.phones[0]);
    expect(verifyCallArg0).toBe(user.phones[0]);
    expect(verifyCallArg1).toBe(code);

    // User create calls
    expect(createUserCallArg1).toBeTruthy();
    expect(createUserCallArg0).toStrictEqual({
      phones: user.phones[0],
      firstName: user.firstName,
      lastName: user.lastName,
      cpf: user.cpf,
      birth: new Date(user.birth.toUTCString()),
    });

    // Session calls
    expect(sessionCreateCallArg0).toStrictEqual(user);
    expect(sessionCreateCallArg1).toBe(userAgent);
    expect(sessionCreateCallArg2).toBe(ip);

    expect(response).toStrictEqual({
      user: {
        id: user._id,
      },
      session: {
        token,
      },
    });
  });
});
