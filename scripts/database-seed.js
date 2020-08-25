const { Models } = require("@gx-mob/http-service");
const { connect, disconnect } = require("@gx-mob/http-service/dist/database");
const faker = require("faker");

module.exports = async function seed() {
  await connect(process.env.DATABASE_URI);

  // Create voyager user
  const voyager = await Models.UserModel.create({
    pid: "1",
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    cpf: "123.456.789-09",
    phones: ["+5582988444444"],
    birth: new Date(),
    averageEvaluation: 0,
  });

  // Create driver user
  const driver = await Models.UserModel.create({
    pid: "2",
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    cpf: "118.586.320-64",
    phones: ["+5582988444448"],
    birth: new Date(),
    averageEvaluation: 0,
    groups: [1, 2],
  });

  // generate some user rides
  for (let i = 0; i < 5; ++i) {
    const durationTotal = faker.random.number({ min: 1, max: 7 });
    const distanceTotal = faker.random.number({ min: 10, max: 30 });
    const base = durationTotal + distanceTotal;

    await Models.RideModel.create({
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
          aditionalFoLongRide: 0,
          aditionalForOutBusinessTime: 0,
        },
        duration: {
          total: durationTotal,
          aditionalFoLongRide: 0,
          aditionalForOutBusinessTime: 0,
        },
      },
    });
  }

  // await disconnect();
};
