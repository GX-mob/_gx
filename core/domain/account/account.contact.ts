import { IAccount } from "./account.types";
import {
  NotOwnContactException,
  RemoveContactNotAllowed,
} from "./account.exceptions";
import { AccountSecurity } from "./account.security";
import {
  ContactObject,
  EContactTypes,
  InvalidContactException,
} from "../value-objects/contact.value-object";

export function checkIfHasContact(
  userData: IAccount,
  value: string,
): ContactObject {
  const contact = new ContactObject(value);
  let hasContact: boolean;

  switch (contact.getType()) {
    case EContactTypes.Email:
      hasContact =
        userData.primaryEmail === contact.value ||
        userData.secondariesEmails.includes(contact.value);
    case EContactTypes.Phone:
      hasContact =
        userData.primaryMobilePhone === contact.value ||
        userData.secondariesMobilePhones.includes(contact.value);
  }

  if (!hasContact) {
    throw new NotOwnContactException();
  }

  return contact;
}

export class AccountContact extends AccountSecurity {
  public setPrimaryEmail(contact: string) {
    const contactObj = checkIfHasContact(this.data, contact);

    if (contactObj.getType() !== "email") {
      throw new InvalidContactException();
    }

    this.data.primaryEmail = contactObj.value;
  }

  public setPrimaryMobilePhone(contact: string) {
    const contactObj = checkIfHasContact(this.data, contact);

    if (contactObj.getType() !== "phone") {
      throw new InvalidContactException();
    }

    this.data.primaryMobilePhone = contactObj.value;
  }

  public addContact(contact: string) {
    const contactObject = new ContactObject(contact);

    switch (contactObject.getType()) {
      case EContactTypes.Email:
        this.addEmail(contactObject.value);
        break;
      case EContactTypes.Phone:
        this.addMobilePhone(contactObject.value);
        break;
    }
  }

  private addEmail(value: string) {
    this.data.secondariesEmails.push(value);
  }

  private addMobilePhone(value: string) {
    this.data.secondariesMobilePhones.push(value);
  }

  public async removeContact(contact: string) {
    const isPrimaryPhoneOrEmail =
      contact === this.data.primaryEmail ||
      contact === this.data.primaryMobilePhone;
    const is2FATarget = this.data["2fa"] && contact === this.data["2fa"];

    if (isPrimaryPhoneOrEmail || is2FATarget) {
      throw new RemoveContactNotAllowed();
    }

    const contactObject = new ContactObject(contact);

    switch (contactObject.getType()) {
      case EContactTypes.Email:
        this.removeEmail(contactObject.value);
        break;
      case EContactTypes.Phone:
        this.removeMobilePhone(contactObject.value);
        break;
    }
  }

  private removeEmail(email: string) {
    const index = this.data.secondariesEmails.indexOf(email);
    this.data.secondariesEmails.splice(index, 1);
  }

  private removeMobilePhone(mobileNumber: string) {
    const index = this.data.secondariesMobilePhones.indexOf(mobileNumber);
    this.data.secondariesMobilePhones.splice(index, 1);
  }

  public hasContact(value: string): ContactObject {
    return checkIfHasContact(this.data, value);
  }
}
