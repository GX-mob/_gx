import { IUser } from "../../domain/user";

export interface ISessionHistory {
  action: string;
  date: Date;
}

export interface ISession {
  _id: any;
  user: IUser;
  userAgent: string;
  ips: (string | null)[];
  createdAt: Date;
  active: boolean;
  history: ISessionHistory[]
}
