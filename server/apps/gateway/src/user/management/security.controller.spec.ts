/**
 * @group unit/controller
 * @group unit/gateway/controller
 * @group unit/gateway/user/controller
 * @group unit/gateway/user/security
 * @group unit/gateway/user/security/controller
 */
import { Test } from "@nestjs/testing";
import faker from "faker";
import { LoggerModule } from "nestjs-pino";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule, CacheService } from "@app/cache";
import { RepositoryModule, RepositoryService } from "@app/repositories";
import { SessionModule } from "@app/session";
import {
  ContactVerificationModule,
  TwilioService,
} from "@app/contact-verification";
import { UserModule } from "../user.module";
import { UserService } from "../user.service";
import { mockUser } from "@testing/testing";
import { UserSecurityController } from "./security.controller";
import { UpdatePasswordDto, Enable2FADto, Disable2FADto } from "../user.dto";

describe("User: SecurityController", () => {
  let usersService: UserService;
  let controller: UserSecurityController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        LoggerModule.forRoot(),
        UserModule,
        SessionModule,
        CacheModule,
        RepositoryModule,
        ContactVerificationModule,
      ],
      controllers: [UserSecurityController],
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

    usersService = moduleRef.get<UserService>(UserService);
    controller = moduleRef.get<UserSecurityController>(UserSecurityController);
  });

  it("updatePasswordHandler", async () => {
    const user = mockUser({ password: faker.random.alphaNumeric(12) });
    const intended = faker.random.alphaNumeric(12);
    const updatePasswordDto = new UpdatePasswordDto();
    updatePasswordDto.current = user.password as string;
    updatePasswordDto.intended = intended;

    const updatePassword = jest
      .spyOn(usersService, "updatePassword")
      .mockResolvedValue();

    await controller.updatePasswordHandler(user, updatePasswordDto);

    expect(updatePassword).toBeCalledWith(user, user.password, intended);
  });

  it("enable2FAHander", async () => {
    const user = mockUser({ password: faker.random.alphaNumeric(12) });
    const [contact] = user.phones;
    const enable2FADto = new Enable2FADto();
    enable2FADto.contact = contact;

    const enable2FA = jest.spyOn(usersService, "enable2FA").mockResolvedValue();

    await controller.enable2FAHander(user, enable2FADto);

    expect(enable2FA).toBeCalledWith(user, contact);
  });

  it("disable2FAHandler", async () => {
    const user = mockUser({ password: faker.random.alphaNumeric(12) });
    const [contact] = user.phones;
    const password = user.password as string;
    const disable2FADto = new Disable2FADto();
    disable2FADto.password = password;

    const disable2FA = jest
      .spyOn(usersService, "disable2FA")
      .mockResolvedValue();

    await controller.disable2FAHandler(user, disable2FADto);

    expect(disable2FA).toBeCalledWith(user, password);
  });
});
