/**
 * User model
 *
 * @group unit/models/user
 */
import { connect, disconnect } from "../";
import { MongoMemoryServer } from "mongodb-memory-server";
import { UserModel } from "./user";

const mockUser = {
  firstName: "First",
  lastName: "Last",
  cpf: "123.456.789-09",
  phones: ["82988888888"],
  emails: ["valid@email.com"],
  birth: new Date("06/13/1994"),
  password: "asd",
};

describe("Model: User", () => {
  const mongoServer = new MongoMemoryServer();

  beforeAll(async () => {
    const URI = await mongoServer.getUri();

    await connect(URI);
  });

  afterAll(async () => {
    await disconnect();
    await mongoServer.stop();
  });

  it("should throw errors due to empty required fields", () => {
    const user = new UserModel();
    const { errors } = user.validateSync() as any;

    expect(Object.keys(errors).length).toBe(4);
  });

  it("should throw error due to invalid cpf", () => {
    const user = new UserModel({
      ...mockUser,
      cpf: "000",
    });

    const { errors } = user.validateSync() as any;

    expect(errors.cpf.message).toBe(`000 isn't a valid cpf`);
  });

  it("should throw error due to any invalid email", () => {
    const user = new UserModel({
      ...mockUser,
      emails: ["foo@bar"],
    });

    const { errors } = user.validateSync() as any;

    expect(errors.emails.message).toBe(`foo@bar has an invalid email`);
  });

  it("should throw error due to any invalid phone", () => {
    const user = new UserModel({
      ...mockUser,
      phones: ["55", "988888888"],
    });

    const { errors } = user.validateSync() as any;

    expect(errors.phones.message).toBe(
      `55,988888888 has an invalid mobile phone`
    );
  });
});
