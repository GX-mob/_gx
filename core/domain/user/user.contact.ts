import { RemoveContactNotAllowed } from "./user.exceptions";
import { IUser } from "../../interfaces";
import { UserSecurity } from "./user.security";
import { ContactObject } from "../value-objects/contact.value-object";

export function hasContact(userData: IUser, value: string) {
  const contact = new ContactObject(value);

  switch (contact.getType()) {
    case "email":
      return (
        userData.primaryEmail === contact.value ||
        userData.secondariesEmails.includes(contact.value)
      );
    case "phone":
      return (
        userData.primaryMobilePhone === contact.value ||
        userData.secondariesMobilePhones.includes(contact.value)
      );
  }
}

export class UserContact extends UserSecurity {
  public setPrimaryEmail(contact: string) {}
  public setPrimaryMobilePhone(contact: string) {}

  public async addContact(contact: string) {
    const contactObject = new ContactObject(contact);
    contactObject.validate();

    switch (contactObject.getType()) {
      case "email": this.addEmail(contactObject.value); break;
      case "phone": this.addMobilePhone(contactObject.value); break;
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
    contactObject.validate();

    await super.assertPassword(rawSentPassword);

    switch (contactObject.getType()) {
      case "email": this.removeEmail(contactObject.value); break;
      case "phone": this.removeMobilePhone(contactObject.value); break;
    }
  }

  private removeEmail(email: string) {
    const index = this.userData.secondariesEmails.indexOf(email);
    this.userData.secondariesEmails.splice(index, 1);
  }

  private removeMobilePhone(mobileNumber: string) {
    const index = this.userData.secondariesMobilePhones.indexOf(
      mobileNumber,
    );
    this.userData.secondariesMobilePhones.splice(index, 1);
  }

  public hasContact(value: string): boolean {
    return hasContact(this.userData, value);
  }
}
