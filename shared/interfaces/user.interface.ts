export enum UserRoles {
  VOYAGER = "VOYAGER",
  DRIVER = "DRIVER",
}

export interface UserInterface {
  _id: any;
  /**
   * Public ID
   */
  pid: string;
  firstName: string;
  lastName: string;
  cpf: string;
  phones: string | string[];
  birth: Date;
  averageEvaluation: number;
  avatar?: string;
  emails: string | string[];
  createdAt?: Date;
  updatedAt?: Date;
  roles: UserRoles[];
  password?: string;
  ["2fa"]?: string;
}
