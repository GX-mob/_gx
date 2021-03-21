import { IVerification } from "../verification";

export enum EUserRoles {
  Voyager = "voyager",
  Driver = "driver",
}

export enum EAccountMode {
  ParentAccount = 'parent-account',
  ChildAccount = 'child-account'
}

export enum EAvailableCountries {
  BR = "BR"
}

export interface IUser {
  _id: any;
  /**
   * Public ID
   */
  pid: string;
  mode: EAccountMode;
  parentAccount?: IUser;
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
  roles: EUserRoles[];
  password?: string;
  ["2fa"]?: string;
}
