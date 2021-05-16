import { AuthService } from "@app/auth";
import { ContactVerificationService } from "@app/contact-verification";
import { util } from "@app/helpers";
import {
  AccountRepository,
  SessionRepository,
  TAccountUpdate,
} from "@app/repositories";
import { Account, AccountCreate } from "@core/domain/account";
import { ContactObject } from "@core/domain/value-objects/contact.value-object";
import {
  IContactVerificationResponseDto,
  IDynamicAuthRequestDto,
} from "@core/interfaces";
import { Injectable } from "@nestjs/common";
import {
  ContactRegistredException,
  ContactVerificationFailedException,
  UserNotFoundException,
} from "./exceptions";
import {
  RemoveContactDto,
  UpdatePasswordDto,
  UpdateProfileDto,
  UserRegisterDto,
} from "./account.dto";

@Injectable()
export class AccountService {
  constructor(
    private accountRepository: AccountRepository,
    private sessionRepository: SessionRepository,
    private authService: AuthService,
    private contactVerificationService: ContactVerificationService,
  ) {}

  /**
   * @throws [HTTP] UserNotFoundException
   * @returns User
   */
  async findByContact(value: string) {
    const contactObj = new ContactObject(value);
    const user = await this.accountRepository.findByContact(contactObj);

    if (!user) {
      throw new UserNotFoundException();
    }

    return user;
  }

  /**
   * @param target Target that will receive the code
   * @returns Hidded target
   */
  public async requestContactVerification(
    target: string,
  ): Promise<IContactVerificationResponseDto & { hiddenTarget: string }> {
    const contactObj = new ContactObject(target);

    const verificationRequestId = await this.contactVerificationService.request(
      contactObj.value,
      contactObj.getType(),
    );

    const hiddenTarget =
      contactObj.getType() === "email"
        ? util.hideEmail(target)
        : // Last 4 phone numbers
          target.slice(target.length - 4);

    return {
      hiddenTarget,
      verificationRequestId,
    };
  }

  public async checkContactVerification(
    target: string,
    code: string,
    verificationRequestId: string,
  ) {
    const contactObj = new ContactObject(target);
    const valid = await this.contactVerificationService.validate(
      contactObj.value,
      code,
      verificationRequestId,
    );

    if (!valid) {
      throw new ContactVerificationFailedException();
    }
  }

  public async create(userCreateDto: UserRegisterDto): Promise<Account> {
    const userCreate = new AccountCreate(userCreateDto, "");

    /**
     * Ensures security checks
     */
    //await this.usersService.checkInUseContact(userCreate.contactObject.value);
    await this.checkContactVerification(
      userCreate.contactObject.value,
      userCreateDto.verificationCode,
      userCreateDto.verificationRequestId,
    );

    return new Account(await this.accountRepository.create(userCreate));
  }

  async update(user: Account, data: TAccountUpdate) {
    await this.accountRepository.updateByQuery({ _id: user.getID() }, data);
    return this.sessionRepository.updateCache({ user: user.getID() });
  }

  async updateAvatar(user: Account, avatarUrl: string) {
    user.setProfileAvatar(avatarUrl);
    await this.accountRepository.update(user);
  }

  async updateProfile(user: Account, updateProfileDto: UpdateProfileDto) {
    const { firstName, lastName } = updateProfileDto;

    if (firstName) {
      user.setFirstName(firstName);
    }

    if (lastName) {
      user.setLastName(lastName);
    }

    await this.accountRepository.update(user);
  }

  async updatePassword(account: Account, updateData: UpdatePasswordDto) {
    await this.authService.authorizeRequest(updateData, account);
    await account.upsertPassword(updateData.passwordIntended);
    await this.accountRepository.update(account);
  }

  public enable2FA(account: Account, target: string) {
    account.enable2FA(target);

    return this.accountRepository.update(account);
  }

  async disable2FA(account: Account, authRequestData: IDynamicAuthRequestDto) {
    await this.authService.authorizeRequest(authRequestData, account);

    await account.disable2FA();
    await this.accountRepository.update(account);
  }

  async checkInUseContact(contact: string) {
    const contactObj = new ContactObject(contact);
    const user = await this.accountRepository.findByContact(contactObj);

    if (user) {
      throw new ContactRegistredException();
    }
  }

  async addContact(user: Account, contact: string, code: string) {
    user.addContact(contact);
    return this.accountRepository.update(user);
  }

  async removeContact(account: Account, requestDto: RemoveContactDto) {
    await this.authService.authorizeRequest(requestDto, account);
    await account.removeContact(requestDto.target);
    await this.accountRepository.update(account);
  }
}
