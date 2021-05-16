import { nanoid } from "nanoid";
import { IUserRegisterDto } from "../../interfaces/dto/account-register-dto.interfaces";
import { IAccount } from "./account.types";
import { FederalIDObject } from "../value-objects/federial-id.value-object";
import { ContactObject } from "../value-objects/contact.value-object";
import { PasswordObject } from "../value-objects/password.value-object";
import { TermsVersionObject } from "../value-objects/terms-version.value-object";
import { USER_PID_LENGTH } from "../../constants";

export type TAccountCreate = Omit<
  IAccount,
  | "_id"
  | "pid"
  | "averageEvaluation"
  | "roles"
  | "secondariesMobilePhones"
  | "secondariesEmails"
  | "accountVerifications"
  | "primaryEmail"
  | "primaryMobilePhone"
> &
  Partial<Pick<IAccount, "primaryEmail" | "primaryMobilePhone">>;

export class AccountCreate {
  static currentTermsVersion = "0.0.0";
  private userData!: TAccountCreate & Pick<IAccount, "pid">;

  public readonly termsVersionObject: TermsVersionObject;
  public readonly contactObject: ContactObject;
  public readonly federalIDObject: FederalIDObject;

  constructor(userCreateDto: IUserRegisterDto, currentTermsVersion: string) {
    this.termsVersionObject = new TermsVersionObject(
      userCreateDto.termsAcceptedVersion,
      currentTermsVersion,
    );
    this.contactObject = new ContactObject(userCreateDto.contact);
    this.federalIDObject = new FederalIDObject(
      userCreateDto.federalID,
      userCreateDto.country,
    );

    this.userData = {
      pid: nanoid(USER_PID_LENGTH),
      federalID: this.federalIDObject.value,
      mode: userCreateDto.mode,
      country: userCreateDto.country,
      termsAcceptedVersion: userCreateDto.termsAcceptedVersion,
      firstName: userCreateDto.firstName,
      lastName: userCreateDto.lastName,
      birth: userCreateDto.birth,
      ...(this.contactObject.getType() === "email"
        ? { primaryEmail: this.contactObject.value }
        : { primaryMobilePhone: this.contactObject.value }),
    };

    if (userCreateDto.password) {
      const passwordObject = new PasswordObject(userCreateDto.password);
      this.userData.password = passwordObject.value;
    }
  }

  getCreationData(): TAccountCreate {
    return this.userData;
  }
}
