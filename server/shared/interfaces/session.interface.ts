import { UserInterface } from "./user.interface";

export interface SessionInterface {
  _id: any;
  user: UserInterface;
  userAgent: string;
  ips: (string | null)[];
  createdAt: Date;
  active: boolean;
}
