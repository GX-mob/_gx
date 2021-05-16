import { IAccount } from "./account.types";
import { AccountBase } from "./account.base";
import { AccountContact } from "./account.contact";
import { AccountProfile } from "./account.profile";
import { AccountSecurity } from "./account.security";
import { FederalIDObject } from "../value-objects/federial-id.value-object";
import { Verification } from "../verification";

export class Account extends AccountBase {
  private contact: AccountContact;
  private profile: AccountProfile;
  private security: AccountSecurity;

  constructor(protected userData: IAccount) {
    super(userData);
    this.contact = new AccountContact(userData);
    this.profile = new AccountProfile(userData);
    this.security = new AccountSecurity(userData);
  }

  // Contact
  public setPrimaryEmail(contact: string) {
    return this.contact.setPrimaryEmail(contact);
  }

  public setPrimaryMobilePhone(contact: string) {
    return this.contact.setPrimaryMobilePhone(contact);
  }

  public addContact(contact: string) {
    return this.contact.addContact(contact);
  }
  public removeContact(contact: string) {
    return this.contact.removeContact(contact);
  }

  // Profile
  public setFirstName(value: string) {
    return this.profile.setFirstName(value);
  }

  public setLastName(value: string) {
    return this.profile.setLastName(value);
  }

  public setBirthDate(value: Date) {
    return this.profile.setBirthDate(value);
  }

  public setProfileAvatar(value: string) {
    return this.profile.setProfileAvatar(value);
  }

  // Security
  public upsertPassword(newRawPassword: string) {
    return this.security.upsertPassword(newRawPassword);
  }

  public enable2FA(userContactTarget: string) {
    return this.security.enable2FA(userContactTarget);
  }

  public async disable2FA() {
    return this.security.disable2FA();
  }

  //
  public setFederalID(value: string) {
    const federalIDObject = new FederalIDObject(value, this.data.country);
    this.data.federalID = federalIDObject.value;
  }

  public setAccountVerification(verification: Verification) {
    this.data.accountVerifications.push(verification.getID());
  }

  public getContact() {
    return this.contact;
  }
  public getProfile() {
    return this.profile;
  }
  public getSecurity() {
    return this.security;
  }
}
