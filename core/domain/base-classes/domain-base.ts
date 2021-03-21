export abstract class DomainBase<T extends Record<string, any>> {
  private initialData: T;

  constructor(protected data: T) {
    this.initialData = { ...data };
  }

  public getID(): any {
    return this.data._id;
  }

  public abstract validate(): void;

  // TODO: get only updated fields
  public getUpdatedData(): Partial<T> {
    return {};
  }

  public getData(): T {
    return this.data;
  }
}
