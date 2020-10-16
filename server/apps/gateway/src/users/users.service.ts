// Application Service
import { Injectable } from "@nestjs/common";
import {
  UserRepository,
  UserCreateInterface,
  UserUpdateInterface,
} from "@app/repositories";
import { ContactVerificationService } from "@app/contact-verification";
import {
  UserNotFoundException,
  WrongPasswordException,
  WrongVerificationCodeException,
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
import { IUser } from "@shared/interfaces";
import { isValidCPF } from "@brazilian-utils/brazilian-utils";
import validator from "validator";

type ContactTypes = "email" | "phone";

@Injectable()
export class UsersService {
  constructor(
    private userRepository: UserRepository,
    private contactVerificationService: ContactVerificationService,
  ) {}

  /**
   * Find user by phone
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

  async assertPassword(user: IUser, password: string) {
    const result = await util.assertPassword(password, user.password as string);

    if (!result) {
      throw new WrongPasswordException();
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
      throw new WrongVerificationCodeException();
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
     * * Only on the first ride the CPF is consulted with the government api
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

  updateById(id: IUser["_id"], data: UserUpdateInterface) {
    return this.userRepository.update({ _id: id }, data);
  }

  async updatePassword(user: IUser, current: string, newPassword: string) {
    if (!user.password) {
      const password = await util.hashPassword(newPassword);

      await this.userRepository.model.updateOne(
        { _id: user._id },
        { password },
      );

      return;
    }

    const currentPasswordCompare = await util.assertPassword(
      current,
      user.password,
    );

    if (!currentPasswordCompare) {
      throw new WrongPasswordException();
    }

    const matchToCurrentPassword = await util.assertPassword(
      newPassword,
      user.password,
    );

    if (matchToCurrentPassword) {
      throw new UnchangedPasswordException();
    }

    const password = await util.hashPassword(newPassword);

    await this.userRepository.model.updateOne({ _id: user._id }, { password });
  }

  async enable2FA(user: IUser, target: string) {
    this.validateContact(target);
    this.passwordRequired(user);

    if (!user.phones.includes(target) && !user.emails.includes(target)) {
      throw new NotOwnContactException();
    }

    await this.userRepository.update({ _id: user._id }, { "2fa": target });
  }

  async disable2FA(user: IUser, password: string) {
    this.passwordRequired(user);

    const matchPassword = await util.assertPassword(
      password,
      user.password as string,
    );

    if (!matchPassword) {
      throw new WrongPasswordException();
    }

    this.userRepository.update({ _id: user._id }, { "2fa": "" });
  }

  private passwordRequired(user: IUser) {
    if (!user.password) {
      throw new PasswordRequiredException();
    }
  }

  /**
   * Validates the contact and return the type
   * @param contact
   */
  validateContact(contact: string): ContactTypes {
    const isMobilePhone = validator.isMobilePhone(contact);

    if (!isMobilePhone || !validator.isEmail(contact)) {
      throw new InvalidContactException();
    }

    return isMobilePhone ? "phone" : "email";
  }

  private getContactFieldName(type: ContactTypes): "emails" | "phones" {
    return type === "email" ? "emails" : "phones";
  }

  async checkInUseContact(contact: string) {
    const type = this.validateContact(contact);
    const field = this.getContactFieldName(type);
    const user = await this.userRepository.get({ [field]: contact });

    if (user) {
      throw new ContactRegistredException();
    }
  }

  async addContact(user: IUser, contact: string, code: string) {
    const type = await this.verifyContact(contact, code);
    const field = this.getContactFieldName(type);

    const update = {
      [field]: [...(user[field] || []), contact],
    };

    await this.userRepository.update({ _id: user._id }, update);
  }

  async removeContact(user: IUser, contact: string) {
    const type = this.validateContact(contact);
    const field = this.getContactFieldName(type);

    /**
     * Prevent removing the last contact or
     * the second factor authentication
     */
    if (
      [...user.phones, ...user.emails].length === 1 ||
      user["2fa"] === contact
    ) {
      throw new RemoveContactNotAllowed();
    }

    const updated = [...user[field]];
    const index = updated.indexOf(contact);

    updated.splice(index, 1);

    await this.userRepository.update({ _id: user._id }, { [field]: updated });
  }
}
