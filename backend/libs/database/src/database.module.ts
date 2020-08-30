import { Module } from "@nestjs/common";
import { databaseModelsProviders } from "./providers";
import { DatabaseService } from "./database.service";

@Module({
  providers: [...databaseModelsProviders, DatabaseService],
  exports: [...databaseModelsProviders, DatabaseService],
})
export class DatabaseModule {}
