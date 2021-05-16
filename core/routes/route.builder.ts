type TRouteParamConfig = {
  endpointOnly?: boolean;
  replaceParams?: Record<string, string>;
};

export class RouterBuild<T extends Object = Object> {
  private nestedRoutesCache: Map<string, RouterBuild> = new Map();

  constructor(public readonly basePath: string, private routes: T) {}

  public route<RouterID extends keyof T>(
    routeId?: RouterID,
    { endpointOnly, replaceParams }: TRouteParamConfig = {},
  ): T[RouterID] extends object ? RouterBuild<T[RouterID]> : string {
    if (!routeId)
      return this.replaceParams(
        this.basePath,
        replaceParams,
      ) as T[RouterID] extends object ? RouterBuild<T[RouterID]> : string;

    const routeConfig = this.routes[routeId];
    const baseUrl = `${ endpointOnly ? '' : `${this.basePath}/`}`;

    if (typeof routeConfig === "string") {
      return (`${baseUrl}${routeConfig}` as unknown) as T[RouterID] extends object
        ? RouterBuild<T[RouterID]>
        : string;
    }

    const cachedRouteInstance = this.nestedRoutesCache.get(routeId as string);

    if (cachedRouteInstance) {
      return cachedRouteInstance as T[RouterID] extends object
        ? RouterBuild<T[RouterID]>
        : string;
    }

    const routeInstance = new RouterBuild(
      `${baseUrl}${routeId}`,
      routeConfig,
    );

    this.nestedRoutesCache.set(routeId as string, routeInstance);

    return routeInstance as T[RouterID] extends object
      ? RouterBuild<T[RouterID]>
      : string;
  }

  private replaceParams(value: string, params?: Record<string, string>) {
    if (!params) return value;
    let final = value;

    for (const key in params) {
      final = final.replace(`:${key}`, params[key]);
    }

    return final;
  }
}