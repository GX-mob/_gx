import { IUser } from "./user.types";
import {
  NotOwnContactException,
  RemoveContactNotAllowed,
} from "./user.exceptions";
import { UserSecurity } from "./user.security";
import {
  ContactObject,
  InvalidContactException,
} from "../value-objects/contact.value-object";

export function checkIfHasContact(
  userData: IUser,
  value: string,
): ContactObject {
  const contact = new ContactObject(value);
  let hasContact: boolean;

  switch (contact.getType()) {
    case "email":
      hasContact =
        userData.primaryEmail === contact.value ||
        userData.secondariesEmails.includes(contact.value);
    case "phone":
      hasContact =
        userData.primaryMobilePhone === contact.value ||
        userData.secondariesMobilePhones.includes(contact.value);
  }

  if (!hasContact) {
    throw new NotOwnContactException();
  }

  return contact;
}

export class UserContact extends UserSecurity {
  public setPrimaryEmail(contact: string) {
    const contactObj = checkIfHasContact(this.userData, contact);

    if (contactObj.getType() !== "email") {
      throw new InvalidContactException();
    }

    this.userData.primaryEmail = contactObj.value;
  }

  public setPrimaryMobilePhone(contact: string) {
    const contactObj = checkIfHasContact(this.userData, contact);

    if (contactObj.getType() !== "phone") {
      throw new InvalidContactException();
    }

    this.userData.primaryMobilePhone = contactObj.value;
  }

  public async addContact(contact: string) {
    const contactObject = new ContactObject(contact);

    switch (contactObject.getType()) {
      case "email":
        this.addEmail(contactObject.value);
        break;
      case "phone":
        this.addMobilePhone(contactObject.value);
        break;
    }
  }

  private addEmail(value: string) {
    this.userData.secondariesEmails.push(value);
  }

  private addMobilePhone(value: string) {
    this.userData.secondariesMobilePhones.push(value);
  }

  public async removeContact(contact: string, rawSentPassword: string) {
    const isPrimaryPhoneOrEmail =
      contact === this.userData.primaryEmail ||
      contact === this.userData.primaryMobilePhone;
    const is2FATarget =
      this.userData["2fa"] && contact === this.userData["2fa"];

    if (isPrimaryPhoneOrEmail || is2FATarget) {
      throw new RemoveContactNotAllowed();
    }

    const contactObject = new ContactObject(contact);

    await super.assertPassword(rawSentPassword);

    switch (contactObject.getType()) {
      case "email":
        this.removeEmail(contactObject.value);
        break;
      case "phone":
        this.removeMobilePhone(contactObject.value);
        break;
    }
  }

  private removeEmail(email: string) {
    const index = this.userData.secondariesEmails.indexOf(email);
    this.userData.secondariesEmails.splice(index, 1);
  }

  private removeMobilePhone(mobileNumber: string) {
    const index = this.userData.secondariesMobilePhones.indexOf(mobileNumber);
    this.userData.secondariesMobilePhones.splice(index, 1);
  }

  public hasContact(value: string): ContactObject {
    return checkIfHasContact(this.userData, value);
  }
}
