import { IUser } from "./user.interface";

export interface ISession {
  _id: any;
  user: IUser;
  userAgent: string;
  ips: (string | null)[];
  createdAt: Date;
  active: boolean;
}
