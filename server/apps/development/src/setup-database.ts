import { MongoMemoryReplSet } from "mongodb-memory-server";
import {
  RepositoryService,
  UserModel,
  RideModel,
  VehicleMetadataModel,
  VehicleModel,
  RideAreaConfigurationModel,
} from "@app/repositories";
import {
  UserRoles,
  RideAreaConfigurationInterface,
  RideTypeConfigurationInterface,
  VehicleTypes,
} from "@shared/interfaces";
import { util } from "@app/helpers";
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

export async function startDatabase(logging: boolean = true) {
  logging && log("MongoDB", chalk`{yellow Starting Server}`);

  const mongoReplSetServer = new MongoMemoryReplSet({
    replSet: { storageEngine: "wiredTiger" },
  });

  await mongoReplSetServer.waitUntilRunning();

  process.env.DATABASE_URI = await mongoReplSetServer.getUri();

  logging &&
    log(
      "MongoDB",
      chalk`{yellow URI: ${chalk.bold(process.env.DATABASE_URI)}}`,
    );
  logging &&
    log("MongoDB", chalk`{yellow Setted DATABASE_URI enviroment variable}`);
  logging && log("MongoDB", chalk`{yellow Seeding...}`);
  await seedDatabase(logging);
  logging && log("MongoDB", chalk`{yellow Seeded.}`);

  return mongoReplSetServer;
}

export async function seedDatabase(logging: boolean = true) {
  const db = new RepositoryService(
    { get: () => process.env.DATABASE_URI } as any,
    { setContext: () => {}, error: console.log, info: () => {} } as any,
  );

  await Promise.all(db.connections);

  logging &&
    log("MongoDB", chalk`{yellow Seeding rides service configuration...}`);

  const rideType1: RideTypeConfigurationInterface = {
    type: 1,
    available: true,
    perKilometer: 1.1,
    perMinute: 0.3,
    kilometerMultipler: 0.2,
    minuteMultipler: 0.1,
    overBusinessTimeKmAdd: 0.4,
    overBusinessTimeMinuteAdd: 0.3,
  };

  const rideType2: RideTypeConfigurationInterface = {
    type: 2,
    available: true,
    perKilometer: 1.6,
    perMinute: 0.5,
    kilometerMultipler: 0.3,
    minuteMultipler: 0.2,
    overBusinessTimeKmAdd: 0.6,
    overBusinessTimeMinuteAdd: 0.5,
  };

  const prices: RideAreaConfigurationInterface[] = [
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

  await Promise.all([RideAreaConfigurationModel.create(prices)]);

  logging && log("MongoDB", chalk`{yellow Seeding users...}`);
  // Create voyager user
  const voyager = await UserModel.create({
    pid: "1",
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    cpf: "123.456.789-09",
    phones: ["+5582988444444"],
    emails: [],
    birth: new Date(),
    averageEvaluation: 5,
    roles: [UserRoles.VOYAGER],
  });

  // Create driver user
  const driver = await UserModel.create({
    pid: "2",
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    cpf: "118.586.320-64",
    phones: ["+5582988444448"],
    emails: [],
    birth: new Date(),
    averageEvaluation: 5,
    password: (await util.securePassword.hash(Buffer.from("123456"))).toString(
      "base64",
    ),
    roles: [UserRoles.VOYAGER, UserRoles.DRIVER],
  });

  // Create driver user
  const driver2 = await UserModel.create({
    pid: "3",
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    cpf: "879.372.190-09",
    phones: ["+5582988444449"],
    emails: [],
    birth: new Date(),
    averageEvaluation: 5,
    password: (await util.securePassword.hash(Buffer.from("123456"))).toString(
      "base64",
    ),
    roles: [UserRoles.VOYAGER, UserRoles.DRIVER],
  });

  logging && log("MongoDB", chalk`{yellow Seeding some rides...}`);

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
        distance: 10,
        duration: 10,
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

  // Create vehicle model and vehicle for driver

  logging && log("MongoDB", chalk`{yellow Seeding vehicle's...}`);

  const { _id: vehicleMetadataID } = await VehicleMetadataModel.create({
    name: "Vehicle",
    manufacturer: "Vehicle manufacturer",
    type: VehicleTypes.HATCH,
  });

  await VehicleModel.create({
    plate: "ABCD-1234",
    year: 2015,
    metadata: vehicleMetadataID,
    owner: driver._id,
    inUse: false,
    permissions: [],
  });
}
