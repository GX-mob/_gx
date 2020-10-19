import { ISession } from "@shared/interfaces";

import { mockUser } from "./user.mock";

export function mockSession(override?: Partial<ISession>) {
  const session: ISession = {
    _id: "",
    user: mockUser(),
    userAgent: "asd",
    ips: [""],
    createdAt: new Date(),
    active: true,
    ...override,
  };

  return session;
}
