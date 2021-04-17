import { IAccount } from "./account.types";
import { AccountBase } from "./account.base";
import { AccountContact } from "./account.contact";
import { AccountProfile } from "./account.profile";
import { AccountSecurity } from "./account.security";
import { FederalIDObject } from "../value-objects/federial-id.value-object";
import { Verification } from "../verification";

export class Account extends AccountBase {
  private userContact: AccountContact;
  private userProfile: AccountProfile;
  private userSecurity: AccountSecurity;

  constructor(protected userData: IAccount) {
    super(userData);
    this.userContact = new AccountContact(userData);
    this.userProfile = new AccountProfile(userData);
    this.userSecurity = new AccountSecurity(userData);
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

  //
  public setFederalID(value: string) {
    const federalIDObject = new FederalIDObject(value, this.data.country);
    this.data.federalID = federalIDObject.value;
  }

  public setAccountVerification(verification: Verification) {
    this.data.accountVerifications.push(verification.getID());
  }
}
