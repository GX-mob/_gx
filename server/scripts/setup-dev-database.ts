import { MongoMemoryReplSet } from "mongodb-memory-server";
import {
  RepositoryService,
  PriceDetail,
  Price,
  PriceModel,
  UserModel,
  RideModel,
  //@ts-ignore
} from "../dist/apps/common/libs/repositories/src";
import chalk from "chalk";
import faker from "faker";
import { log } from "./util";

export async function createReplSetServer() {
  const mongoReplSetServer = new MongoMemoryReplSet({
    replSet: { storageEngine: "wiredTiger" },
  });

  await mongoReplSetServer.waitUntilRunning();

  return mongoReplSetServer.getUri();
}

export async function startDatabase() {
  log("MongoDB", chalk`{yellow Starting Server}`);

  const mongoReplSetServer = new MongoMemoryReplSet({
    replSet: { storageEngine: "wiredTiger" },
  });

  await mongoReplSetServer.waitUntilRunning();

  process.env.DATABASE_URI = await mongoReplSetServer.getUri();

  log("MongoDB", chalk`{yellow URI: ${chalk.bold(process.env.DATABASE_URI)}}`);
  log("MongoDB", chalk`{yellow Setted DATABASE_URI enviroment variable}`);
  log("MongoDB", chalk`{yellow Seeding...}`);
  await seedDatabase();
  log("MongoDB", chalk`{yellow Seeded.}`);

  return mongoReplSetServer;
}

export async function seedDatabase() {
  const db = new RepositoryService(
    { get: () => process.env.DATABASE_URI },
    { setContext: () => {}, error: console.log, info: () => {} },
  );

  await Promise.all(db.connections);

  log("MongoDB", chalk`{yellow Seeding rides service configuration...}`);

  const rideType1: PriceDetail = {
    type: 1,
    available: true,
    perKilometer: 1.1,
    perMinute: 0.3,
    kilometerMultipler: 0.2,
    minuteMultipler: 0.1,
    overBusinessTimeKmAdd: 0.4,
    overBusinessTimeMinuteAdd: 0.3,
  };

  const rideType2: PriceDetail = {
    type: 2,
    available: true,
    perKilometer: 1.6,
    perMinute: 0.5,
    kilometerMultipler: 0.3,
    minuteMultipler: 0.2,
    overBusinessTimeKmAdd: 0.6,
    overBusinessTimeMinuteAdd: 0.5,
  };

  const prices: Price[] = [
    {
      area: "AL",
      currency: "BRL",
      timezone: "America/Maceio",
      general: [rideType1, rideType2],
      subAreas: {
        maceio: [rideType1, rideType2],
      },
    },
    {
      area: "PE",
      currency: "BRL",
      timezone: "America/Maceio",
      general: [rideType1, rideType2],
      subAreas: {
        recife: [rideType1, rideType2],
      },
    },
  ];

  await Promise.all([PriceModel.create(prices)]);

  log("MongoDB", chalk`{yellow Seeding users...}`);
  // Create voyager user
  const voyager = await UserModel.create({
    pid: "1",
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    cpf: "123.456.789-09",
    phones: ["+5582988444444"],
    birth: new Date(),
    averageEvaluation: 0,
  });

  // Create driver user
  const driver = await UserModel.create({
    pid: "2",
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    cpf: "118.586.320-64",
    phones: ["+5582988444448"],
    birth: new Date(),
    averageEvaluation: 0,
    roles: ["voyager", "driver"],
  });

  log("MongoDB", chalk`{yellow Seeding some rides...}`);
  // generate some user rides
  for (let i = 0; i < 5; ++i) {
    const durationTotal = faker.random.number({ min: 1, max: 7 });
    const distanceTotal = faker.random.number({ min: 10, max: 30 });
    const base = durationTotal + distanceTotal;

    await RideModel.create({
      pid: faker.random.alphaNumeric(10),
      voyager: voyager._id,
      driver: driver._id,
      type: i % 2 ? 1 : 2,
      payMethod: i % 2 ? 1 : 2,
      country: "BR",
      area: "AL",
      subArea: "Maceió",
      status: "COMPLETED",
      route: {
        start: {
          primary: "",
          secondary: "",
          district: "",
          coord: [-9.57399, -35.772365],
        },
        end: {
          primary: "",
          secondary: "",
          district: "",
          coord: [-9.57399, -35.772365],
        },
        path: "",
        distance: 0,
      },
      costs: {
        base,
        total: base,
        distance: {
          total: distanceTotal,
          aditionalForLongRide: 0,
          aditionalForOutBusinessTime: 0,
        },
        duration: {
          total: durationTotal,
          aditionalForLongRide: 0,
          aditionalForOutBusinessTime: 0,
        },
      },
    });
  }
}
