import { IUser } from "@core/domain/user";

export interface ISession {
  _id: any;
  user: IUser;
  userAgent: string;
  ips: (string | null)[];
  createdAt: Date;
  active: boolean;
}
