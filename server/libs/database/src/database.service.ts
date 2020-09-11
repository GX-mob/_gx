import { Connection, ConnectionOptions } from "mongoose";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PinoLogger } from "nestjs-pino";
import Connections from "./connections";
import { UserModel } from "./schemas/user";
import { SessionModel } from "./schemas/session";
import { RideModel } from "./schemas/ride";
import { PendencieModel } from "./schemas/pendencie";
import { PriceModel } from "./schemas/prices";

const options: ConnectionOptions = {
  useNewUrlParser: true,
  keepAlive: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  autoIndex: process.env.NODE_ENV !== "production",
};

@Injectable()
export class DatabaseService {
  readonly userModel = UserModel;
  readonly sessionModel = SessionModel;
  readonly rideModel = RideModel;
  readonly pendencieModel = PendencieModel;
  readonly priceModel = PriceModel;
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
    logger.setContext(DatabaseService.name);
    const databaseUri = this.configService.get("DATABASE_URI") as string;

    this.connect(databaseUri);
  }

  private async connect(DATABASE_URI: string) {
    if (Connections.Configuration.readyState === 1) {
      return;
    }

    Connections.Configuration.openUri(DATABASE_URI, options);

    return this.initLogs();
  }

  private initLogs() {
    this.initConnectionLogger(Connections.Configuration);
    this.initConnectionLogger(Connections.Users);
    this.initConnectionLogger(Connections.Sessions);
    this.initConnectionLogger(Connections.Rides);
  }

  private initConnectionLogger(connection: Connection) {
    connection.on("connected", () => {
      this.logger.info({ database: connection.name }, "connected");
    });

    connection.on("disconnected", () => {
      this.logger.warn({ database: connection.name }, "disconnected");
    });
  }
}
