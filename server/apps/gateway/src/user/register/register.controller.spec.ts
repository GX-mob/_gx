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
import { UserModule } from "../user.module";
import { UserService } from "../user.service";
import {
  ContactDto,
  ContactVerificationCheckDto,
  UserRegisterDto,
} from "../user.dto";
import { mockUser, mockSession } from "@testing/testing";
import faker from "faker";
import { UserRegisterController } from "./register.controller";

describe("SignUpController", () => {
  let controller: UserRegisterController;
  let usersService: UserService;
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
        UserModule,
      ],
      controllers: [UserRegisterController],
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
    usersService = moduleRef.get<UserService>(UserService);
    controller = moduleRef.get<UserRegisterController>(UserRegisterController);
  });

  it("phoneVerificationRequest", async () => {
    const [contact] = mockUser().phones;
    const checkInUseContact = jest
      .spyOn(usersService, "checkInUseContact")
      .mockImplementationOnce(async () => {});
    const requestContactVerify = jest
      .spyOn(usersService, "requestContactVerify")
      .mockImplementationOnce(async () => "");

    const contactDto = new ContactDto();
    contactDto.contact = contact;

    await controller.phoneVerificationRequest(contactDto);

    expect(checkInUseContact).toBeCalledWith(contactDto.contact);
    expect(requestContactVerify).toBeCalledWith(contactDto.contact);
  });

  it("contactVerificationCheck", async () => {
    const [contact] = mockUser().phones;
    const code = "000000";
    const verifyContact = jest
      .spyOn(usersService, "verifyContact")
      .mockImplementationOnce(async () => "phone");

    const contactVerificationCheckDto = new ContactVerificationCheckDto();
    contactVerificationCheckDto.contact = contact;
    contactVerificationCheckDto.code = code;

    await controller.contactVerificationCheck(contactVerificationCheckDto);

    expect(verifyContact).toBeCalledWith(contact, code);
  });

  it("signUp", async () => {
    const user = mockUser();
    const session = mockSession();
    const token = faker.random.alphaNumeric(12);
    const userAgent = faker.internet.userAgent();
    const ip = faker.internet.ip();
    const code = "000000";

    const checkInUseContact = jest
      .spyOn(usersService, "checkInUseContact")
      .mockImplementationOnce(async () => {});
    const verifyContact = jest
      .spyOn(usersService, "verifyContact")
      .mockImplementationOnce(async () => "phone");
    const userCreate = jest
      .spyOn(usersService, "create")
      .mockImplementationOnce(async () => user);
    const sessionCreate = jest
      .spyOn(sessionService, "create")
      .mockImplementationOnce(async () => ({ session, token }));

    const signUpDto = new UserRegisterDto();
    signUpDto.contact = user.phones[0];
    signUpDto.code = code;
    signUpDto.cpf = user.cpf;
    signUpDto.firstName = user.firstName;
    signUpDto.lastName = user.lastName;
    signUpDto.terms = true;
    signUpDto.birth = user.birth.toUTCString();

    const response = await controller.signUp(ip, userAgent, signUpDto);

    // Security ensures calls
    expect(checkInUseContact).toBeCalledWith(signUpDto.contact);
    expect(verifyContact).toBeCalledWith(signUpDto.contact, signUpDto.code);

    // User create calls
    expect(userCreate).toBeCalledWith(
      {
        phones: user.phones[0],
        firstName: user.firstName,
        lastName: user.lastName,
        cpf: user.cpf,
        birth: new Date(user.birth.toUTCString()),
      },
      true,
    );

    // Session calls
    expect(sessionCreate).toBeCalledWith(user, userAgent, ip);

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
