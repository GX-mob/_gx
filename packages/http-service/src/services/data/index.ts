import { Service, Inject } from "fastify-decorators";
import { CacheService } from "../cache";
import mongoose, { DocumentQuery, Document } from "mongoose";
import { handleRejectionByUnderHood } from "../../helpers/utils";

// Standard handlers
import { User, UserModel } from "../../models/user";
import { Session, SessionModel } from "../../models/session";

interface Settings<Model> {
  namespace: string;
  linkingKeys?: Array<keyof Model>;
  autoPopulate?: Array<keyof Model>;
}

/**
 * Abstraction to manipulate the cached and persistent data of a single record, respectively.
 */
export class Handler<Model> {
  constructor(
    private cache: CacheService,
    private model: mongoose.Model<any>,
    private settings: Settings<Model>
  ) {}

  /**
   * Get a record from the cache, if it doesn't exist, get from persistent and update the cache
   * @param query
   * @returns
   * @constructs {Model}
   */
  async get(
    query: Partial<Model>,
    populate: Array<keyof Model> | false = this.settings.autoPopulate
  ): Promise<Model | null> {
    const cache = await this.cache.get(this.settings.namespace, query);

    if (cache) {
      return cache;
    }

    const persistent = await this.makeQuery(query, populate);

    if (persistent) {
      const setCache = this.cache.set(
        this.settings.namespace,
        { _id: (persistent as any)._id }, // prevent circular for linking keys
        persistent,
        { link: this.settings.linkingKeys && this.mountLinkingKeys(persistent) }
      );
      handleRejectionByUnderHood(setCache);

      return persistent as Model;
    }
    return null;
  }

  private async makeQuery(
    query: Partial<Model>,
    populate: Array<keyof Model> | false
  ) {
    const _query = this.model.findOne(query).lean();

    if (populate) {
      this.populateObject(_query);
    }

    return _query;
  }

  private populateObject(query: DocumentQuery<any, any> | Document) {
    for (let i = 0; i < this.settings.autoPopulate.length; i++) {
      query.populate(this.settings.autoPopulate[i] as string);
    }

    return query;
  }

  /**
   * Updates a record in persistent storage and cache it
   * @param query
   * @param data
   */
  async update(query: any, data: Partial<Model>) {
    await this.model.updateOne(query, data);
    await this.setCache(query, data);
  }

  /**
   * Creates a item in persistent storage and cache it
   * @param data
   * @param cache Cache after created
   * @default true
   * @returns
   * @constructs {Model}
   */
  async create(
    data: Omit<Model, "_id">,
    options = { cache: true }
  ): Promise<Model> {
    let modelResult = await this.model.create(data as Model);

    if (this.settings.autoPopulate) {
      modelResult = await (this.populateObject(
        modelResult
      ) as Document).execPopulate();
    }

    if (options.cache)
      await this.setCache({ _id: modelResult._doc._id }, modelResult._doc);
    return modelResult;
  }

  async setCache(key: any, data: any): Promise<void> {
    const saved = await this.cache.get(this.settings.namespace, key);

    await this.cache.set(
      this.settings.namespace,
      key,
      { ...(saved || {}), ...data },
      { link: this.settings.linkingKeys && this.mountLinkingKeys(data) }
    );
  }

  /**
   * * CAUTION!
   * * Remove record from PERSISTENT storage and cache.
   * @param query
   * @returns {Promise<void>}
   */
  async remove(query: any) {
    await this.model.deleteOne(query);
    await this.cache.del(this.settings.namespace, query);
  }

  mountLinkingKeys(data) {
    const clean = this.settings.linkingKeys.filter(
      (key) => !this.isEmpty(data[key])
    );

    return clean.reduce((final, key) => {
      const value = data[key];

      /**
       * Creates a link key to each value of array
       * to work according to "least one"
       * approach of mongo querying array field
       */
      if (Array.isArray(value)) {
        return [
          ...final,
          ...value.map((value) => JSON.stringify({ [key]: value })),
        ];
      }

      return [...final, JSON.stringify({ [key]: value })];
    }, []);
  }

  isEmpty(value) {
    if (Array.isArray(value)) {
      return value.length === 0;
    }

    if (value instanceof Object) {
      return Object.keys(value).length === 0;
    }

    return !value;
  }
}

@Service()
export class DataService {
  @Inject(CacheService)
  public cache!: CacheService;

  public users = this.create<User>(UserModel, {
    namespace: "users",
    linkingKeys: ["phones", "emails", "cpf"],
  });
  public sessions = this.create<Session>(SessionModel, {
    namespace: "sessions",
    autoPopulate: ["user"],
  });
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
  create<Model>(
    model: mongoose.Model<any>,
    settings: Settings<Model>
  ): Handler<Model> {
    return new Handler<Model>(this.cache, model, settings);
  }
}
