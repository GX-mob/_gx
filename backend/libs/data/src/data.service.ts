import { Injectable } from "@nestjs/common";
import mongoose from "mongoose";
import { DatabaseService, User, Session, Ride, Pendencie } from "@app/database";
import { CacheService } from "@app/cache";
import { Handler, Settings } from "./handler";

@Injectable()
export class DataService {
  public users: Handler<User, Omit<User, "pid" | "averageEvaluation">>;
  public sessions: Handler<Session, Omit<Session, "active">>;
  public rides: Handler<Ride, Omit<Ride, "pid" | "status">>;
  public pendencies: Handler<Pendencie, Omit<Pendencie, "resolved">>;

  constructor(
    private databaseService: DatabaseService,
    private cache: CacheService,
  ) {
    this.users = this.create(this.databaseService.userModel, {
      namespace: "users",
      linkingKeys: ["pid", "phones", "emails", "cpf"],
    });

    this.sessions = this.create(this.databaseService.sessionModel, {
      namespace: "sessions",
      autoPopulate: ["user"],
    });

    this.rides = this.create(this.databaseService.rideModel, {
      namespace: "rides",
      linkingKeys: ["pid"],
      autoPopulate: ["voyager", "driver", "pendencies"],
    });

    this.pendencies = this.create(this.databaseService.pendencieModel, {
      namespace: "pendencies",
      linkingKeys: ["issuer", "affected"],
    });
  }

  /**
   *
   * @param model
   * @param settings
   * @param settings.namespace Cache namespace
   * @param settings.linkingKeys Cache linking keys
   * @param settings.autoPopulate Model auto populate
   * @returns
   * @constructs {Handler}
   */
  create<Model, Create = Model>(
    model: mongoose.Model<any>,
    settings: Settings<Model>,
  ) {
    return new Handler<Model, Create>(this.cache, model, settings);
  }
}
