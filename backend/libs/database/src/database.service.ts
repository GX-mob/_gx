import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Connections from "./connections";
import { UserModel } from "./schemas/user";
import { SessionModel } from "./schemas/session";
import { RideModel } from "./schemas/ride";
import { PendencieModel } from "./schemas/pendencie";

const options = {
  useNewUrlParser: true,
  keepAlive: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  autoIndex: process.env.NODE_ENV !== "production",
};

@Injectable()
export class DatabaseService {
  public userModel = UserModel;
  public sessionModel = SessionModel;
  public rideModel = RideModel;
  public pendencieModel = PendencieModel;

  constructor(private configService: ConfigService<{ DATABASE_URI: string }>) {
    this.connect(this.configService.get("DATABASE_URI") as string);
  }

  private async connect(DATABASE_URI: string) {
    await Promise.all([
      Connections.Users.openUri(DATABASE_URI, options),
      Connections.Sessions,
      Connections.Rides,
    ]);
  }

  private createConnectionLogger() {}
}
