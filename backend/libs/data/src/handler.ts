import mongoose, { DocumentQuery, Document } from "mongoose";
import { CacheService } from "@app/cache";
import { util } from "@app/helpers";

export type Settings<Model> = {
  namespace: string;
  linkingKeys?: Array<keyof Model>;
  autoPopulate?: Array<keyof Model>;
};

/**
 * Abstraction to manipulate the cached and persistent data of a single record, respectively.
 */
export class Handler<Model, Create> {
  constructor(
    private cache: CacheService,
    public model: mongoose.Model<any>,
    private settings: Settings<Model>,
  ) {}

  /**
   * Get a record from the cache, if it doesn't exist, get from persistent and update the cache
   * @param query
   * @returns
   * @constructs {Model}
   */
  async get(query: Partial<Model>): Promise<Model | null> {
    const cache = await this.cache.get(this.settings.namespace, query);

    if (cache) {
      return cache;
    }

    const data = await this.makeQuery(query);

    if (!data) {
      return null;
    }

    this.setCache(data);

    return data as Model;
  }

  // getMany(query, )

  private async makeQuery(query: Partial<Model>) {
    const _query = this.model.findOne(query).lean();

    this.populateObject(_query);

    return _query;
  }

  private populateObject(query: DocumentQuery<any, any> | Document) {
    if (!this.settings.autoPopulate) {
      return query;
    }

    for (let i = 0; i < this.settings.autoPopulate.length; i++) {
      query.populate(this.settings.autoPopulate[i] as string);
    }

    return query;
  }

  private async setCache(data: any): Promise<void> {
    const promise = this.cache.set(
      this.settings.namespace,
      { _id: data._id }, // using the doc._id to prevent a circular reference on linking keys
      data,
      {
        link: this.mountLinkingKeys(data),
      },
    );
    util.handleRejectionByUnderHood(promise);
  }

  /**
   * Updates a record in persistent storage and cache
   * @param query
   * @param data
   */
  async update(query: any, data: Partial<Model>) {
    await this.model.updateOne(query, data);
    this.updateCache(query);
  }

  /**
   * Creates a item in persistent storage and cache it
   * @param data
   * @param options.cache Cache after created
   * @default true
   * @returns Lean document
   */
  async create(
    data: Omit<Create, "_id">,
    options = { cache: true },
  ): Promise<Model> {
    let modelResult = await this.model.create((data as unknown) as Model);

    if (this.settings.autoPopulate) {
      modelResult = await (this.populateObject(
        modelResult,
      ) as Document).execPopulate();
    }

    if (options.cache) {
      this.setCache(modelResult._doc);
    }

    return modelResult;
  }

  async updateCache(query: Partial<Model>) {
    const data = await this.makeQuery(query);

    if (!data) return;

    this.setCache(data);
  }

  /**
   * * CAUTION!
   * * Remove record from PERSISTENT storage and cache.
   * @param query
   * @returns {Promise<void>}
   */
  async remove(query: any): Promise<void> {
    await this.model.deleteOne(query);
    await this.cache.del(this.settings.namespace, query);
  }

  private mountLinkingKeys(data: any): string[] | undefined {
    if (!this.settings.linkingKeys) {
      return;
    }

    const clean = this.settings.linkingKeys.filter(
      (key) => !this.isEmpty(data[key]),
    );

    return clean.reduce<string[]>((final, key) => {
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

  public isEmpty(value: any) {
    if (Array.isArray(value)) {
      return value.length === 0;
    }

    if (value instanceof Object) {
      return Object.keys(value).length === 0;
    }

    return !value;
  }
}
