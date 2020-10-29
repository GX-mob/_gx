import faker from "faker";
import { IUser, UserRoles } from "@shared/interfaces";

export function mockPhone() {
  const random = Math.floor(Math.random() * 999999);
  return `+5582988${String(random).padEnd(6, "0")}`;
}
// @ https://gist.github.com/willianns/3246637
function gera_random(n: number) {
  var ranNum = Math.round(Math.random() * n);
  return ranNum;
}

function mod(dividendo: number, divisor: number) {
  return Math.round(dividendo - Math.floor(dividendo / divisor) * divisor);
}

export function mockCpf(point = true) {
  var n = 9;
  var n1 = gera_random(n);
  var n2 = gera_random(n);
  var n3 = gera_random(n);
  var n4 = gera_random(n);
  var n5 = gera_random(n);
  var n6 = gera_random(n);
  var n7 = gera_random(n);
  var n8 = gera_random(n);
  var n9 = gera_random(n);
  var d1 =
    n9 * 2 +
    n8 * 3 +
    n7 * 4 +
    n6 * 5 +
    n5 * 6 +
    n4 * 7 +
    n3 * 8 +
    n2 * 9 +
    n1 * 10;
  d1 = 11 - mod(d1, 11);
  if (d1 >= 10) d1 = 0;
  var d2 =
    d1 * 2 +
    n9 * 3 +
    n8 * 4 +
    n7 * 5 +
    n6 * 6 +
    n5 * 7 +
    n4 * 8 +
    n3 * 9 +
    n2 * 10 +
    n1 * 11;
  d2 = 11 - mod(d2, 11);
  if (d2 >= 10) d2 = 0;

  if (point)
    return (
      "" +
      n1 +
      n2 +
      n3 +
      "." +
      n4 +
      n5 +
      n6 +
      "." +
      n7 +
      n8 +
      n9 +
      "-" +
      d1 +
      d2
    );
  else return "" + n1 + n2 + n3 + n4 + n5 + n6 + n7 + n8 + n9 + d1 + d2;
}

export function mockUser(override: Partial<IUser> = {}): IUser {
  const user: IUser = {
    _id: faker.random.alphaNumeric(12),
    pid: faker.random.alphaNumeric(12),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    cpf: mockCpf(),
    phones: [mockPhone()],
    emails: [faker.internet.email()],
    birth: faker.date.past(18),
    averageEvaluation: faker.random.number({ min: 1, max: 5 }),
    roles: [UserRoles.VOYAGER],
    ...override,
  };
  return user;
}
