import { Injectable } from "@nestjs/common";
import mongoose from "mongoose";
import { DatabaseService, User, Session, Ride, Pendencie } from "@app/database";
import { CacheService } from "@app/cache";
import { RepositoryFactory, Settings } from "./repository-factory";

@Injectable()
export class DataService {
  public users: RepositoryFactory<
    User,
    Omit<User, "pid" | "averageEvaluation" | "emails" | "roles">
  >;
  public sessions: RepositoryFactory<Session, Omit<Session, "active">>;
  public rides: RepositoryFactory<Ride, Omit<Ride, "pid" | "status">>;
  public pendencies: RepositoryFactory<Pendencie, Omit<Pendencie, "resolved">>;

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
    return new RepositoryFactory<Model, Create>(this.cache, model, settings);
  }
}
