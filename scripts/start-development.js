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
const prompt = new Prompt({
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

const titles = {
  services: { title: "Service", color: "cyan" },
  apps: { title: "App", color: "blue" },
  pwa: { title: "PWA", color: "green" },
};

(async function init() {
  const selected = (await prompt.run({})).map((options) => options.split("/"));

  if (!selected.length) return;

  console.log(chalk.bold("Starting development environment"));
  selected.map((run, idx) => startApplication(idx, run));
})().catch((err) => console.log(err));

async function startApplication(idx, [directory, app]) {
  const { title, color } = titles[directory];
  const appTitle = capitalize(app);
  console.log(chalk.bold("Starting"), chalk[color].bold(title), appTitle);

  const child = spawn(`npm run dev`, [], {
    shell: true,
    cwd: join(directory, app),
  });

  process.stdin.pipe(child.stdin);

  child.stdout.on("data", (data) => {
    console.log(
      `[${chalk.bold(title)}] ${chalk[color].bold(appTitle)}: ${data.slice(
        0,
        -1
      )}`
    );
  });
}

const capitalize = (s) => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};
