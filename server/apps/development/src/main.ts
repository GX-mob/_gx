import { spawn } from "child_process";
import { log } from "./util";
import chalk from "chalk";
import { startDatabase, seedDatabase } from "./setup-database";

async function start() {
  const [, , action] = process.argv;

  switch (action) {
    case "seed":
      if (!process.env.DATABASE_URI) {
        await startDatabase();
      }
      await seedDatabase();
      break;
    default:
      console.log("Action not especified");
  }

  process.exit(1);
}

start();
