import { IVerification } from "../verification";

export enum EAccountRoles {
  Voyager = "voyager",
  Driver = "driver",
}

export enum EAccountMode {
  ParentAccount = "parent-account",
  ChildAccount = "child-account",
}

export enum EAvailableCountries {
  BR = "BR",
}

export interface IAccountProfile {
  firstName: string;
  lastName: string;
  birth: Date;
}

export interface IAccount {
  _id: any;
  /**
   * Public ID
   */
  pid: string;
  mode: EAccountMode;
  parentAccount?: IAccount;
  accountVerifications: IVerification[];
  country: EAvailableCountries;
  firstName: string;
  lastName: string;
  federalID: string;
  primaryMobilePhone: string;
  secondariesMobilePhones: string[];
  primaryEmail: string;
  secondariesEmails: string[];
  birth: Date;
  termsAcceptedVersion: string;
  averageEvaluation: number;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
  roles: EAccountRoles[];
  password?: string;
  ["2fa"]?: string;
}
