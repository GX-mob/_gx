/**
 * @group unit/controller
 * @group unit/gateway/controller
 * @group unit/gateway/users/controller
 * @group unit/gateway/users/contact
 * @group unit/gateway/users/contact/controller
 */
import { Test } from "@nestjs/testing";
import faker from "faker";
import { LoggerModule } from "nestjs-pino";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule, CacheService } from "@app/cache";
import { RepositoryModule } from "@app/repositories";
import { AuthModule } from "@app/auth";
import {
  ContactVerificationModule,
  TwilioService,
} from "@app/contact-verification";
import { UserModule } from "../account.module";
import { AccountService } from "../account.service";
import { mockUser, mockPhone } from "@testing/testing";

import { UserContactController } from "./contact.controller";
import { ContactDto, ContactVerificationCheckDto } from "../account.dto";
import { RemoveContactDto } from "../account.dto";

describe("User: ContactController", () => {
  let usersService: AccountService;
  let controller: UserContactController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        LoggerModule.forRoot(),
        UserModule,
        AuthModule,
        CacheModule,
        RepositoryModule,
        ContactVerificationModule,
      ],
      controllers: [UserContactController],
    })
      .overrideProvider(ConfigService)
      .useValue({ get() {} })
      .overrideProvider(CacheService)
      .useValue({})
      .overrideProvider(TwilioService)
      .useValue({})
      .compile();

    usersService = moduleRef.get<AccountService>(AccountService);
    controller = moduleRef.get<UserContactController>(UserContactController);
  });

  it("verifiContactRequest", async () => {
    const contact = mockPhone();
    const contactDto = new ContactDto();
    contactDto.contact = contact;

    const checkInUseContact = jest
      .spyOn(usersService, "checkInUseContact")
      .mockResolvedValue();
    const requestContactVerify = jest
      .spyOn(usersService, "requestContactVerify")
      .mockResolvedValue("");

    await controller.verifyContactRequest(contactDto);

    expect(checkInUseContact).toBeCalledWith(contact);
    expect(requestContactVerify).toBeCalledWith(contact);
  });

  it("addContact", async () => {
    const user = mockUser();
    const [contact] = user.phones;
    const code = "000000";
    const addContact = jest
      .spyOn(usersService, "addContact")
      .mockResolvedValue();
    const contactVerificationCheckDto = new ContactVerificationCheckDto();
    contactVerificationCheckDto.contact = contact;
    contactVerificationCheckDto.code = "000000";

    await controller.addContact(user, contactVerificationCheckDto);

    expect(addContact).toBeCalledWith(user, contact, code);
  });

  it("removeContact", async () => {
    const password = faker.random.alphaNumeric(12);
    const user = mockUser();
    const [contact] = user.phones;
    const removeContact = jest
      .spyOn(usersService, "removeContact")
      .mockResolvedValue();
    const contactVerificationCheckDto = new RemoveContactDto();
    contactVerificationCheckDto.contact = contact;
    contactVerificationCheckDto.password = password;

    await controller.removeContact(user, contactVerificationCheckDto);

    expect(removeContact).toBeCalledWith(user, contact, password);
  });
});
