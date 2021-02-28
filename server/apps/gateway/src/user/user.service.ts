// Application Service
import { Injectable } from "@nestjs/common";
import SecurePassword from "secure-password";
import {
  UserRepository,
  UserCreateInterface,
  UserUpdateInterface,
  SessionRepository,
} from "@app/repositories";
import { ContactVerificationService } from "@app/contact-verification";
import {
  UserNotFoundException,
  WrongPasswordException,
  ContactVerificationFailedException,
  InvalidCPFException,
  CPFRegistredException,
  TermsNotAcceptedException,
  UnchangedPasswordException,
  PasswordRequiredException,
  NotOwnContactException,
  InvalidContactException,
  ContactRegistredException,
  RemoveContactNotAllowed,
} from "./exceptions";
import { util } from "@app/helpers";
import { IUser } from "@core/interfaces";
import { isValidCPF } from "@brazilian-utils/brazilian-utils";
import validator from "validator";

import { UserSecurity } from "@core/domain/user/user.security";
import { UserContact } from "@core/domain/user/user.contact";

type ContactTypes = "email" | "phone";

@Injectable()
export class UserService {
  private securePassword = new SecurePassword();

  constructor(
    private userRepository: UserRepository,
    private sessionRepository: SessionRepository,
    private contactVerificationService: ContactVerificationService,
  ) {}

  /**
   * @param phone
   * @throws [HTTP] UserNotFoundException
   * @returns <UserInterface> User
   */
  async findByContact(contact: string) {
    const type = this.validateContact(contact);
    const field = this.getContactFieldName(type);
    const user = await this.userRepository.get({ [field]: contact });

    if (!user) {
      throw new UserNotFoundException();
    }

    return user;
  }

  /**
   * Requests a contact verification
   * @param target Target that will receive the code
   * @returns Hidded target
   */
  public async requestContactVerify(target: string): Promise<string> {
    const type = this.validateContact(target);
    await this.contactVerificationService.request(target);

    const hiddenTarget =
      type === "email"
        ? util.hideEmail(target)
        : // Phone last 4 numbers
          target.slice(target.length - 4);

    return hiddenTarget;
  }

  public async verifyContact(target: string, code: string) {
    const type = this.validateContact(target);
    const valid = await this.contactVerificationService.verify(target, code);

    if (!valid) {
      throw new ContactVerificationFailedException();
    }

    return type;
  }

  public async create(
    user: UserCreateInterface,
    termsAccepted: boolean,
  ): Promise<IUser> {
    const { cpf } = user;

    /**
     * Terms acception
     */
    if (!termsAccepted) {
      throw new TermsNotAcceptedException();
    }

    /**
     * Validate CPF
     * * Only before the first ride the CPF is consulted with the government api
     */
    if (!isValidCPF(cpf)) {
      throw new InvalidCPFException();
    }

    /**
     * Check if CPF is already registred
     */
    const registredCPF = await this.userRepository.get({ cpf });

    if (registredCPF) {
      throw new CPFRegistredException();
    }

    return this.userRepository.create(user);
  }

  async updateById(id: IUser["_id"], data: UserUpdateInterface) {
    await this.userRepository.update({ _id: id }, data);
    return this.sessionRepository.updateCache({ user: id });
  }

  async updatePassword(userData: IUser, currentRawPassword: string, newRawPassword: string) {
    const user = new UserSecurity(userData);

    await user.upsertPassword(currentRawPassword, newRawPassword)

    this.userRepository.update(user);
  }

  enable2FA(userData: IUser, target: string) {
    const user = new UserSecurity(userData);

    user.enable2FA(target);

    return this.userRepository.update(user);

  }

  async disable2FA(userData: IUser, rawSentPassword: string) {
    const user = new UserSecurity(userData);

    await user.disable2FA(rawSentPassword);
    await this.userRepository.update(user);
  }

  /**
   * Validates the contact and return the type
   * @param contact
   */
  validateContact(contact: string): ContactTypes {
    if (validator.isMobilePhone(contact)) {
      return "phone";
    }

    if (validator.isEmail(contact)) {
      return "email";
    }

    throw new InvalidContactException();
  }

  private getContactFieldName(type: ContactTypes): "emails" | "phones" {
    return type === "email" ? "emails" : "phones";
  }

  async checkInUseContact(contact: string) {
    const type = this.validateContact(contact);
    const field = this.getContactFieldName(type);
    const user = await this.userRepository.get({ [field]: contact });
    const user2 = await this.userRepository.get({ [field]: [contact] });

    if (user) {
      throw new ContactRegistredException();
    }
  }

  async addContact(userData: IUser, contact: string, code: string) {
    const user = new UserContact(userData);

    user.addContact(contact);

    return this.userRepository.update(user);
  }

  async removeContact(userData: IUser, contact: string, rawSentPassword: string) {

    const user = new UserContact(userData);
    await user.removeContact(contact, rawSentPassword);
    await this.userRepository.update(user);
  }
}
