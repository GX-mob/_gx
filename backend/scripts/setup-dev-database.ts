import { MongoMemoryServer } from "mongodb-memory-server";
import chalk from "chalk";
import { connect, UserModel, RideModel } from "../libs/database/src";
import faker from "faker";

function log(title: string, content: string, formatTitle = true) {
  if (!title && !content) {
    return (title: string) => (content: string) =>
      log(title, content, typeof title === "undefined");
  }

  if (!content) {
    return console.log(title);
  }

  console.log(formatTitle ? chalk.bold.inverse(` ${title} `) : title, content);
}

async function start() {
  if (!process.env.DATABASE_URI) {
    // const startMongo = (await prompts.mongo.run({}))[0] === "Yes";

    log("MongoDB", chalk`{yellow Starting Server}`);

    const mongoServer = new MongoMemoryServer();
    process.env.DATABASE_URI = await mongoServer.getUri();
    log(
      "MongoDB",
      chalk`{yellow URI: ${chalk.bold(process.env.DATABASE_URI)}}`,
    );
    log("MongoDB", chalk`{yellow Setted DATABASE_URI enviroment variable}`);
    log("MongoDB", chalk`{yellow Seeding...}`);
    await seed();
    log("MongoDB", chalk`{yellow Seeded.}`);
  }
}

async function seed() {
  await connect(process.env.DATABASE_URI as string);

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
      status: "completed",
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

start();
