import { RouterBuild } from "./route.builder";

export const RideRoute = new RouterBuild("ride", {
  find: ":pid",
  "prices-status": "prices-status/:area/:subArea?"
});
