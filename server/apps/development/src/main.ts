import { spawn } from "child_process";
import { log } from "./util";
import chalk from "chalk";
import { startDatabase } from "./setup-database";

async function start() {
  if (!process.env.MONGO_URI) {
    await startDatabase();
  }

  const [, , ...application] = process.argv;

  // TODO: start apps list

  const cmd = `NODE_ENV=development nest start ${application[0]} --watch`;
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
