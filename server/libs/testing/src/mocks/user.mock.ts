import faker from "faker";
import { IUser, UserRoles } from "@shared/interfaces";

export function genNumber() {
  const random = Math.floor(Math.random() * 999999);
  return `5582988${String(random).padEnd(6, "0")}`;
}

export function mockUser(override: Partial<IUser> = {}): IUser {
  const user: IUser = {
    _id: faker.random.alphaNumeric(12),
    pid: faker.random.alphaNumeric(12),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    cpf: "123.456.789-09",
    phones: [genNumber()],
    emails: [faker.internet.email()],
    birth: faker.date.past(18),
    averageEvaluation: faker.random.number({ min: 1, max: 5 }),
    roles: [UserRoles.VOYAGER],
    ...override,
  };
  return user;
}
