export enum EUserRoles {
  VOYAGER = "VOYAGER",
  DRIVER = "DRIVER",
}

export enum EAccountMode {
  ParentAccount = 'parent-account',
  ChildAccount = 'child-account'
}

export enum AvailableCountries {
  BR = "BR"
}

export interface IUser {
  _id: any;
  /**
   * Public ID
   */
  pid: string;
  accountMode: EAccountMode;
  accountVerificationId: string;
  country: AvailableCountries;
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
