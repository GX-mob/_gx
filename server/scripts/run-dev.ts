// import Prompt from "prompt-checkbox";
import { spawn } from "child_process";
import { log } from "./util";
import chalk from "chalk";
import { startDatabase } from "./setup-dev-database";

async function start() {
  await startDatabase();

  const [, , application] = process.argv;

  const cmd = `NODE_ENV=development nest start ${application} --watch`;

  const child = spawn(cmd, [], {
    shell: true,
  });

  process.stdin.pipe(child.stdin);

  child.stdout.on("data", (data) => {
    log(chalk`${data.slice(0, -1)}`);
  });

  child.stderr.on("data", (data) => {
    log(chalk`${data.slice(0, -1)}`);
  });
}

start();
