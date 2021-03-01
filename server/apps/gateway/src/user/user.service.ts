import { Injectable } from "@nestjs/common";
import {
  UserRepository,
  TUserUpdate,
  SessionRepository,
} from "@app/repositories";
import { ContactVerificationService } from "@app/contact-verification";
import {
  ContactRegistredException,
  ContactVerificationFailedException,
  UserNotFoundException,
} from "./exceptions";
import { util } from "@app/helpers";
import {
  IUser,
  UserSecurity,
  UserContact,
  UserCreate,
} from "@core/domain/user";
import { ContactObject } from "@core/domain/value-objects/contact.value-object";

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private sessionRepository: SessionRepository,
    private contactVerificationService: ContactVerificationService,
  ) {}

  /**
   * @throws [HTTP] UserNotFoundException
   * @returns <UserInterface> User
   */
  async findByContact(value: string) {
    const user = await this.userRepository.findByContact(value);

    if (!user) {
      throw new UserNotFoundException();
    }

    return user;
  }

  /**
   * @param target Target that will receive the code
   * @returns Hidded target
   */
  public async requestContactVerification(target: string): Promise<string> {
    const contactObj = new ContactObject(target);

    await this.contactVerificationService.request(contactObj.value);

    const hiddenTarget =
      contactObj.getType() === "email"
        ? util.hideEmail(target)
        : // Phone last 4 numbers
          target.slice(target.length - 4);

    return hiddenTarget;
  }

  public async checkContactVerification(target: string, code: string) {
    const contactObj = new ContactObject(target);
    const valid = await this.contactVerificationService.verify(
      contactObj.value,
      code,
    );

    if (!valid) {
      throw new ContactVerificationFailedException();
    }
  }

  public async create(userCreate: UserCreate): Promise<IUser> {
    return this.userRepository.create(userCreate);
  }

  async updateById(id: IUser["_id"], data: TUserUpdate) {
    await this.userRepository.updateByQuery({ _id: id }, data);
    return this.sessionRepository.updateCache({ user: id });
  }

  async updatePassword(
    userData: IUser,
    currentRawPassword: string,
    newRawPassword: string,
  ) {
    const user = new UserSecurity(userData);

    await user.upsertPassword(currentRawPassword, newRawPassword);

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

  async checkInUseContact(contact: string) {
    const contactObj = new ContactObject(contact);
    const user = await this.userRepository.findByContact(contactObj.value);

    if (user) {
      throw new ContactRegistredException();
    }
  }

  async addContact(userData: IUser, contact: string, code: string) {
    const user = new UserContact(userData);
    user.addContact(contact);
    return this.userRepository.update(user);
  }

  async removeContact(
    userData: IUser,
    contact: string,
    rawSentPassword: string,
  ) {
    const user = new UserContact(userData);
    await user.removeContact(contact, rawSentPassword);
    await this.userRepository.update(user);
  }
}
