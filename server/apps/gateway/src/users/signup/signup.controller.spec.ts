/**
 * @group unit/controller
 * @group unit/gateway/controller
 * @group unit/gateway/users/controller
 */
import { Test } from "@nestjs/testing";
import { LoggerModule } from "nestjs-pino";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule, CacheService } from "@app/cache";
import { RepositoryModule, RepositoryService } from "@app/repositories";
import { SessionModule, SessionService } from "@app/session";
import {
  ContactVerificationModule,
  ContactVerificationService,
  TwilioService,
} from "@app/contact-verification";
import { SignUpController } from "./signup.controller";
import { UsersModule } from "../users.module";
import { UsersService } from "../users.service";
import { ContactDto, ContactVerificationCheckDto } from "../users.dto";
import { mockUser } from "@testing/testing";

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

    const [[checkCalls]] = checkInUseContactSpy.mock.calls;
    const [[requestVerifyCalls]] = requestContactVerifySpy.mock.calls;

    expect(checkCalls).toBe(contact);
    expect(requestVerifyCalls).toBe(contact);
  });
});
