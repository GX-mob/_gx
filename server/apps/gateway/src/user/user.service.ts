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
import { UserCreate, User } from "@core/domain/user";
import { ContactObject } from "@core/domain/value-objects/contact.value-object";
import { UpdateProfileDto, UserRegisterDto } from "./user.dto";

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private sessionRepository: SessionRepository,
    private contactVerificationService: ContactVerificationService,
  ) {}

  /**
   * @throws [HTTP] UserNotFoundException
   * @returns User
   */
  async findByContact(value: string) {
    const contactObj = new ContactObject(value);
    const user = await this.userRepository.findByContact(contactObj);

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

  public async create(userCreateDto: UserRegisterDto): Promise<User> {
    const userCreate = new UserCreate(userCreateDto, "");

    /**
     * Ensures security checks
     */
    //await this.usersService.checkInUseContact(userCreate.contactObject.value);
    await this.checkContactVerification(
      userCreate.contactObject.value,
      userCreateDto.code,
    );

    return new User(await this.userRepository.create(userCreate));
  }

  async update(user: User, data: TUserUpdate) {
    await this.userRepository.updateByQuery({ _id: user.getID() }, data);
    return this.sessionRepository.updateCache({ user: user.getID() });
  }

  async updateAvatar(user: User, avatarUrl: string) {
    user.setProfileAvatar(avatarUrl);
    await this.userRepository.update(user);
  }

  async updateProfile(user: User, updateProfileDto: UpdateProfileDto) {
    const { firstName, lastName } = updateProfileDto;

    if (firstName) {
      user.setFirstName(firstName);
    }

    if (lastName) {
      user.setLastName(lastName);
    }

    await this.userRepository.update(user);
  }

  async updatePassword(
    user: User,
    newRawPassword: string,
    currentRawPassword?: string,
  ) {
    await user.upsertPassword(newRawPassword, currentRawPassword);
    await this.userRepository.update(user);
  }

  public enable2FA(user: User, target: string) {
    user.enable2FA(target);

    return this.userRepository.update(user);
  }

  async disable2FA(user: User, rawSentPassword: string) {
    await user.disable2FA(rawSentPassword);
    await this.userRepository.update(user);
  }

  async checkInUseContact(contact: string) {
    const contactObj = new ContactObject(contact);
    const user = await this.userRepository.findByContact(contactObj);

    if (user) {
      throw new ContactRegistredException();
    }
  }

  async addContact(user: User, contact: string, code: string) {
    user.addContact(contact);
    return this.userRepository.update(user);
  }

  async removeContact(user: User, contact: string, rawSentPassword: string) {
    await user.removeContact(contact, rawSentPassword);
    await this.userRepository.update(user);
  }
}
