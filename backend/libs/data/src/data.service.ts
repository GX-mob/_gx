import { Injectable, Inject } from "@nestjs/common";
import mongoose from "mongoose";
import {
  DatabaseService,
  User,
  UserModel,
  Session,
  SessionModel,
  Ride,
  RideModel,
  Pendencie,
  PendencieModel,
} from "@app/database";
import { CacheService } from "@app/cache";
import { Handler, Settings } from "./handler";

@Injectable()
export class DataService {
  public users = this.create<User, Omit<User, "pid" | "averageEvaluation">>(
    UserModel,
    {
      namespace: "users",
      linkingKeys: ["pid", "phones", "emails", "cpf"],
    },
  );
  public sessions = this.create<Session, Omit<Session, "active">>(
    SessionModel,
    {
      namespace: "sessions",
      autoPopulate: ["user"],
    },
  );
  public rides = this.create<Ride, Omit<Ride, "pid" | "status">>(RideModel, {
    namespace: "rides",
    linkingKeys: ["pid"],
    autoPopulate: ["voyager", "driver", "pendencies"],
  });

  public pendencies = this.create<Pendencie, Omit<Pendencie, "resolved">>(
    PendencieModel,
    {
      namespace: "pendencies",
      linkingKeys: ["issuer", "affected"],
    },
  );

  constructor(
    @Inject(DatabaseService) private databaseService: DatabaseService,
    @Inject(CacheService) private cache: CacheService,
  ) {}

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
