/*
  GX - Corridas
  Copyright (C) 2020  Fernando Costa

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, either version 3 of the
  License, or (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
const { spawn } = require("child_process");
const { join } = require("path");
const chalk = require("chalk");
const Prompt = require("prompt-checkbox");
const MongoMemoryServer = require("mongodb-memory-server").default;

const wait = (ts) => new Promise((resolve) => setTimeout(resolve, ts));

const applicationsPrompt = new Prompt({
  name: "Start development environment",
  message: "What you want to run?",
  radio: true,
  choices: {
    Services: [
      "services/register",
      "services/auth",
      "services/account",
      "services/rides",
      "services/chat",
    ],
    "Native apps": [
      "apps/voyager",
      "apps/rider",
      "apps/enterprise",
      "apps/business",
    ],
    PWA: ["pwa/voyager", "pwa/assistant"],
  },
});

const mongoPrompt = new Prompt({
  name: "MongoDB Server",
  message:
    "Mongo URI environment variable not found, you want start one server now?",
  radio: true,
  choices: ["Yes", "No"],
});

const titles = {
  services: { title: "Service", color: "cyan" },
  apps: { title: "App", color: "blue" },
  pwa: { title: "PWA", color: "green" },
};

(async function init() {
  const applications = (await applicationsPrompt.run({})).map((options) =>
    options.split("/")
  );

  if (!applications.length) return;

  if (!process.env.MONGO_URI) {
    const startMongo = (await mongoPrompt.run({}))[0] === "Yes";

    if (startMongo) {
      console.log(
        `${chalk.bold.inverse(" MongoDB ")} ${chalk.yellow("Starting Server")}`
      );
      const mongoServer = new MongoMemoryServer();
      process.env.MONGO_URI = await mongoServer.getUri();
      console.log(
        `${chalk.bold.inverse(" MongoDB ")} ${chalk.yellow(
          `URI: ${chalk.bold(process.env.MONGO_URI)}`
        )}`
      );

      console.log(
        chalk.bold.inverse(" MongoDB "),
        chalk.yellow(`Setted MONGO_URI enviroment variable`)
      );
    } else {
      console.log(
        `\n${chalk.bold.red.inverse(
          "                       WARNING                       "
        )}\n${chalk.bgRed.bold.whiteBright(
          " Run services that interact with each other without  \n" +
            " a central MongoDB server probably will cause        \n" +
            " data inconsistency issues.                          "
        )} `
      );

      await wait(3000);
    }
  }

  console.log(`\n${chalk.bold("Starting development environment")}\n`);

  applications.map((run) => start(run));
})().catch((err) => console.log(err));

const colors = ["green", "yellow", "blue", "magenta", "red", "cyan"];
let colorIdx = 0;

function start([directory, app]) {
  const color = colors[colorIdx];
  const { title, color: typeColor } = titles[directory];
  const appTitle = capitalize(app);
  console.log(
    chalk.bold("Starting"),
    chalk[typeColor].bold(title),
    chalk[color].bold(appTitle)
  );

  const child = spawn(`npm run dev`, [], {
    shell: true,
    cwd: join(directory, app),
  });

  process.stdin.pipe(child.stdin);

  child.stdout.on("data", (data) => {
    console.log(
      `${chalk.bold.inverse(` ${title} `)} ${chalk[color].bold(
        appTitle
      )}: ${data.slice(0, -1)}`
    );
  });

  ++colorIdx;
}

const capitalize = (s) => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};
