import { IUser } from "../user";

export enum ESessionActions {
  IpAdded = "ip-added",
  Deactivated = "deactivated"
}

export interface ISessionHistory {
  action: ESessionActions;
  date: Date;
}

export type TSessionCreate = Pick<ISession, "user" | "userAgent" | "ips">;

export interface ISession {
  _id: any;
  user: IUser;
  userAgent: string;
  ips: (string | null)[];
  createdAt: Date;
  updatedAt?: Date;
  active: boolean;
  history: ISessionHistory[];
}
