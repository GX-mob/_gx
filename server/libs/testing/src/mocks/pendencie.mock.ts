import faker from "faker";
import { IPendencie } from "@shared/interfaces";

export function mockPendencie(override: Partial<IPendencie> = {}): IPendencie {
  const user: IPendencie = {
    _id: faker.random.alphaNumeric(12),
    ride: faker.random.alphaNumeric(12),
    issuer: faker.random.alphaNumeric(12),
    affected: faker.random.alphaNumeric(12),
    amount: 3,
    resolved: false,
    ...override,
  };
  return user;
}
