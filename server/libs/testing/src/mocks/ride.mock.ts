import faker from "faker";
import {
  IRide,
  RideTypes,
  RidePayMethods,
  RideStatus,
} from "@shared/interfaces";

import { mockUser } from "./user.mock";

export function mockRide(override: Partial<IRide> = {}): IRide {
  const ride: IRide = {
    _id: faker.random.alphaNumeric(12),
    pid: faker.random.alphaNumeric(12),
    voyager: mockUser(),
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
        primary: "I Love Coxinha",
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
