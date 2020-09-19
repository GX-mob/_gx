import faker from "faker";
import {
  RideInterface,
  RideTypes,
  RidePayMethods,
  RideStatus,
  UserInterface,
  UserRoles,
} from "@shared/interfaces";
import { MongoMemoryReplSet } from "mongodb-memory-server";

faker.setLocale("pt_BR");

export async function createReplSetServer() {
  const mongoReplSetServer = new MongoMemoryReplSet({
    replSet: { storageEngine: "wiredTiger" },
  });

  await mongoReplSetServer.waitUntilRunning();

  return mongoReplSetServer;
}

export function mockRide(override: Partial<RideInterface> = {}): RideInterface {
  const ride: RideInterface = {
    _id: faker.random.alphaNumeric(12),
    pid: faker.random.alphaNumeric(12),
    voyager: faker.random.alphaNumeric(12),
    type: RideTypes.Normal,
    payMethod: RidePayMethods.Money,
    country: "BR",
    area: "AL",
    subArea: "maceio",
    status: RideStatus.CREATED,
    route: {
      start: {
        coord: [-9.572722067985174, -35.77662958572795],
        primary: "Tv. Alcinio Teles",
        secondary: "Clima bom - Maceió/AL",
        district: "clima-bom",
      },
      end: {
        coord: [-9.57753, -35.77307],
        primary: "I Loce Coxinha",
        secondary: "R. São Paulo, 246 - Tabuleiro do Martins Maceió - AL",
        district: "tabuleiro-do-martins",
      },
      path:
        "ntly@|rjyER@BiAUG_AqBe@aBo@mB]kAHk@n@e@d@]p@c@`Am@jBqAhBmArBuA|AiAjAo@dAu@hA}@ZDh@bAbAxBfAdCz@hBLF",
      distance: 10,
      duration: 10,
    },
    costs: {
      base: 7,
      total: 7,
      distance: {
        total: 5,
        aditionalForLongRide: 0,
        aditionalForOutBusinessTime: 0,
      },
      duration: {
        total: 2,
        aditionalForLongRide: 0,
        aditionalForOutBusinessTime: 0,
      },
    },
    ...override,
  };

  return ride;
}

function genNumber() {
  const random = Math.floor(Math.random() * 999999);
  return `5582988${String(random).padEnd(6, "0")}`;
}

export function mockUser(override: Partial<UserInterface> = {}): UserInterface {
  const user: UserInterface = {
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
