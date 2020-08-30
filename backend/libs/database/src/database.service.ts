import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Connections from "./connections";

const options = {
  useNewUrlParser: true,
  keepAlive: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  autoIndex: process.env.NODE_ENV !== "production",
};

@Injectable()
export class DatabaseService {
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
