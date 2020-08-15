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

const prompts = {
  applications: new Prompt({
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
  }),
  mongo: new Prompt({
    name: "MongoDB Server",
    message:
      "Mongo URI environment variable not found, you want start one server now?",
    radio: true,
    choices: ["Yes", "No"],
  }),
};

const titles = {
  services: { title: "Service", color: "cyan" },
  apps: { title: "App", color: "blue" },
  pwa: { title: "PWA", color: "green" },
};

function log(title, content, formatTitle = true) {
  if (!title && !content) {
    return (title) => (content) =>
      log(title, content, typeof title === "undefined");
  }

  if (!content) {
    return console.log(title);
  }

  console.log(formatTitle ? chalk.bold.inverse(` ${title} `) : title, content);
}

(async function init() {
  const applications = (await prompts.applications.run({})).map((options) =>
    options.split("/")
  );

  if (!applications.length) return;

  if (applications.length > 1 && !process.env.MONGO_URI) {
    const startMongo = (await prompts.mongo.run({}))[0] === "Yes";

    if (startMongo) {
      log("MongoDB", chalk`{yellow Starting Server}`);

      const mongoServer = new MongoMemoryServer();
      process.env.MONGO_URI = await mongoServer.getUri();
      log("MongoDB", chalk`{yellow URI: ${chalk.bold(process.env.MONGO_URI)}}`);
      log("MongoDB", chalk`{yellow Setted MONGO_URI enviroment variable}`);
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

  log(chalk`\n{bold Starting development environment}\n`);

  applications.map((run, idx) => start(run, idx));
})().catch((err) => {
  console.log(err);
  process.abort();
});

const colors = ["green", "yellow", "blue", "magenta", "red", "cyan"];
let colorIdx = 0;

function start([directory, app]) {
  const color = colors[colorIdx];
  const { title, color: typeColor } = titles[directory];
  const appTitle = capitalize(app);

  const print = log(false)(
    chalk`{bold {inverse  ${title} }{bgBlack  ${chalk[color](appTitle)} }}:`
  );

  const error = log(false)(
    chalk`{bold {inverse  ${title} }{bgRed {white  ${appTitle}} }}:`
  );

  print(chalk`{bold Starting} `);

  const cwd = join(directory, app);

  const cmd = `NODE_ENV=development nodemon --watch './${directory}/${app}/src/**/*.ts' --ignore './${directory}/${app}/src/**/*.spec.ts' --exec 'ts-node-script' --files ./${directory}/${app}/src/bin/index.ts`;

  const child = spawn(cmd, [], {
    shell: true,
  });

  process.stdin.pipe(child.stdin);

  child.stdout.on("data", (data) => {
    print(chalk`${data.slice(0, -1)}`);
  });

  child.stderr.on("data", (data) => {
    error(chalk`${data.slice(0, -1)}`);
  });

  ++colorIdx;

  return child;
}

const capitalize = (s) => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};
