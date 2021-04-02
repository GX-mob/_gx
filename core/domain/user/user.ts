import { IUser } from "./user.types";
import { UserBase } from "./user.base";
import { UserContact } from "./user.contact";
import { UserProfile } from "./user.profile";
import { UserSecurity } from "./user.security";
import { UserAccount } from "./user.account";

export class User extends UserBase {
  private userContact: UserContact;
  private userProfile: UserProfile;
  private userSecurity: UserSecurity;
  private userAccount: UserAccount;

  constructor(protected userData: IUser) {
    super(userData);
    this.userContact = new UserContact(userData);
    this.userProfile = new UserProfile(userData);
    this.userSecurity = new UserSecurity(userData);
    this.userAccount = new UserAccount(userData);
  }

  // Contact
  public setPrimaryEmail(contact: string) {
    return this.userContact.setPrimaryEmail(contact);
  }

  public setPrimaryMobilePhone(contact: string) {
    return this.userContact.setPrimaryMobilePhone(contact);
  }

  public addContact(contact: string) {
    return this.userContact.addContact(contact);
  }
  public removeContact(contact: string, rawSentPassword: string) {
    return this.userContact.removeContact(contact, rawSentPassword);
  }

  // Profile
  public setFirstName(value: string) {
    return this.userProfile.setFirstName(value);
  }

  public setLastName(value: string) {
    return this.userProfile.setLastName(value);
  }

  public setBirthDate(value: Date) {
    return this.userProfile.setBirthDate(value);
  }

  public setProfileAvatar(value: string) {
    return this.userProfile.setProfileAvatar(value);
  }

  // Security
  public upsertPassword(newRawPassword: string, currentRawPassword?: string) {
    return this.userSecurity.upsertPassword(newRawPassword, currentRawPassword);
  }

  public enable2FA(userContactTarget: string) {
    return this.userSecurity.enable2FA(userContactTarget);
  }

  public async disable2FA(rawSentPassword: string) {
    return this.userSecurity.disable2FA(rawSentPassword);
  }
}
