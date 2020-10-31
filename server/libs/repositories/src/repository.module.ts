import { Global, Module, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Connection } from "mongoose";
import { CacheModule } from "@app/cache";
import { ConfigService } from "@nestjs/config";
import { PinoLogger } from "nestjs-pino";
import {
  UserRepository,
  RideRepository,
  SessionRepository,
  PendencieRepository,
  VehicleRepository,
  RideAreaConfigurationRepository,
} from "./repositories";
import { CONNECTION_OPTIONS } from "./constants";
import { Connections } from "./connections";

@Global()
@Module({
  imports: [CacheModule],
  providers: [
    UserRepository,
    RideRepository,
    SessionRepository,
    PendencieRepository,
    VehicleRepository,
    RideAreaConfigurationRepository,
  ],
  exports: [
    UserRepository,
    RideRepository,
    SessionRepository,
    PendencieRepository,
    VehicleRepository,
    RideAreaConfigurationRepository,
  ],
})
export class RepositoryModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private configService: ConfigService,
    private logger: PinoLogger,
  ) {
    logger.setContext(RepositoryModule.name);
  }

  onModuleInit() {
    const databaseUri = this.configService.get("DATABASE_URI") as string;

    this.initConnLogs();

    Connections.Configuration.openUri(databaseUri, CONNECTION_OPTIONS);
  }

  private initConnLogs() {
    Object.values(Connections).forEach((connection) => {
      this.configureConnLogger(connection);
    });
  }

  async onModuleDestroy() {
    await Promise.all(
      Object.values(Connections).map((connection) => connection.close()),
    );

    console.log("closed");
  }

  private configureConnLogger(connection: Connection) {
    connection.on("connected", () => {
      this.logger.info({ database: connection.name }, "connected");
    });

    connection.on("disconnected", () => {
      this.logger.warn({ database: connection.name }, "disconnected");
    });
  }
}
