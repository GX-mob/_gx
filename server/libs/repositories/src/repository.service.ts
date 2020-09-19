import { Connection, ConnectionOptions } from "mongoose";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PinoLogger } from "nestjs-pino";
import Connections from "./connections";
import {
  UserModel,
  SessionModel,
  RideModel,
  PendencieModel,
  RideAreaConfigurationModel,
} from "./models";

const options: ConnectionOptions = {
  useNewUrlParser: true,
  keepAlive: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  autoIndex: process.env.NODE_ENV !== "production",
};

@Injectable()
export class RepositoryService {
  readonly userModel = UserModel;
  readonly sessionModel = SessionModel;
  readonly rideModel = RideModel;
  readonly pendencieModel = PendencieModel;
  readonly rideAreaConfigurationModel = RideAreaConfigurationModel;

  readonly connections = [
    Connections.Configuration,
    Connections.Users,
    Connections.Sessions,
    Connections.Rides,
  ];

  constructor(
    private configService: ConfigService<{ DATABASE_URI: string }>,
    private logger: PinoLogger,
  ) {
    logger.setContext(RepositoryService.name);
    const databaseUri = this.configService.get("DATABASE_URI") as string;

    this.configureConnLogger(Connections.Configuration);
    this.configureConnLogger(Connections.Users);
    this.configureConnLogger(Connections.Sessions);
    this.configureConnLogger(Connections.Rides);

    if (Connections.Configuration.readyState === 1) {
      return;
    }

    Connections.Configuration.openUri(databaseUri, options);
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
